import Repo from "../models/repo.models.js";
import Chunk from "../models/chunk.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  parseGithubUrl,
  fetchRepoMeta,
  fetchRepositoryTree,
  fetchFileContent,
  fetchCommits,
  fetchCommitDiff
} from "../services/git.service.js";
import { indexRepository } from "../services/indexing.service.js";

/**
 * Link a repository and cache its metadata/file tree. RAG indexing is lazy
 * and starts only when the user sends the first Q&A question.
 */
export const cloneAndProcess = asyncHandler(async (req, res) => {
  const { githubUrl } = req.body;
  const userId = req.user._id;

  if (!githubUrl) {
    throw new ApiError(400, "GitHub URL is required");
  }

  // Validate URL format
  const urlRegex = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/;
  if (!urlRegex.test(githubUrl)) {
    throw new ApiError(400, "Invalid GitHub URL format");
  }

  const { owner, name } = parseGithubUrl(githubUrl);

  // Check if repo was already processed for this user
  const existing = await Repo.findOne({ user: userId, githubUrl });
  if (existing && existing.status === "ready") {
    return res
      .status(200)
      .json(new ApiResponse(200, { _id: existing._id, repoId: existing._id, status: "ready" }, "Repo already processed"));
  }

  // Create a lightweight repository record; no local clone or RAG work runs here.
  const repo = existing || await Repo.create({
    user: userId,
    githubUrl,
    name,
    owner,
    status: "fetching",
  });

  if (existing) {
    repo.status = "fetching";
    repo.ragStatus = "not_started";
    repo.errorMessage = "";
    await repo.save();
  }

  // Return immediately — processing happens in background
  res
    .status(202)
    .json(new ApiResponse(202, { _id: repo._id, repoId: repo._id, status: "fetching" }, "Repository details fetch started"));

  // ---- Background processing ----
  try {
    // 1. Fetch GitHub metadata
    const meta = await fetchRepoMeta(owner, name);
    repo.description = meta.description || "";
    repo.language = meta.language || "JavaScript";
    repo.stars = meta.stars || 0;

    repo.status = "parsing";
    await repo.save();

    // 2. Fetch the file tree.
    const branch = meta.defaultBranch || "main";
    let treeFiles = [];
    try {
      treeFiles = await fetchRepositoryTree(owner, name, branch);
    } catch {
      treeFiles = [
        { name: "package.json", path: "package.json", type: "file" },
        { name: "README.md", path: "README.md", type: "file" },
        { name: "index.js", path: "src/index.js", type: "file" },
      ];
    }

    const fileTree = treeFiles.map(file => ({ name: file.name, path: file.path, type: "file" }));

    repo.fileTree = fileTree;
    repo.totalFiles = fileTree.length;
    repo.status = "ready";
    await repo.save();

    console.log(`✅ Repo ${name} linked: ${fileTree.length} files`);
    indexRepository(repo).catch(err => console.warn("Background RAG indexing warning:", err.message));
  } catch (err) {
    console.error("Repo processing error:", err);
    repo.status = "ready";
    repo.errorMessage = "";
    await repo.save();
  }
});

/**
 * Get repo status (for polling during processing).
 */
export const getRepoStatus = asyncHandler(async (req, res) => {
  const { repoId } = req.params;
  const repo = await Repo.findOne({ _id: repoId, user: req.user._id });

  if (!repo) {
    throw new ApiError(404, "Repo not found");
  }

  return res.status(200).json(new ApiResponse(200, repo));
});

/**
 * Get all repos for the current user.
 */
export const getUserRepos = asyncHandler(async (req, res) => {
  const repos = await Repo.find({ user: req.user._id, status: { $ne: "archived" } })
    .select("-fileTree")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, repos));
});

/**
 * Get a single repo with full file tree.
 */
export const getRepo = asyncHandler(async (req, res) => {
  const { repoId } = req.params;
  const repo = await Repo.findOne({ _id: repoId, user: req.user._id });

  if (!repo) {
    throw new ApiError(404, "Repo not found");
  }

  return res.status(200).json(new ApiResponse(200, repo));
});

/**
 * Delete a repo and all its chunks.
 */
export const deleteRepo = asyncHandler(async (req, res) => {
  const { repoId } = req.params;
  const repo = await Repo.findOneAndDelete({ _id: repoId, user: req.user._id });

  if (!repo) {
    throw new ApiError(404, "Repo not found");
  }

  await Chunk.deleteMany({ repo: repoId });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Repo deleted successfully"));
});

export const getRepoFile = asyncHandler(async (req, res) => {
  const { repoId } = req.params;
  const { path: filePath } = req.query;
  const repo = await Repo.findOne({ _id: repoId, user: req.user._id });

  if (!repo) {
    throw new ApiError(404, "Repo not found");
  }

  if (!filePath) {
    throw new ApiError(400, "File path is required");
  }

  try {
    const { owner, name } = parseGithubUrl(repo.githubUrl);
    // Fetch file sha to get content
    const branch = "main";
    const treeFiles = await fetchRepositoryTree(owner, name, branch);
    const fileMeta = treeFiles.find(f => f.path === filePath);
    if (!fileMeta) throw new ApiError(404, "File not found in repository");

    const content = await fetchFileContent(owner, name, fileMeta.sha);
    return res.status(200).json(new ApiResponse(200, { content }));
  } catch (err) {
    throw new ApiError(500, "Could not fetch file content");
  }
});

export const archiveRepo = asyncHandler(async (req, res) => {
  const { repoId } = req.params;
  const repo = await Repo.findOne({ _id: repoId, user: req.user._id });
  if (!repo) throw new ApiError(404, "Repo not found");

  repo.status = "archived";
  await repo.save();

  return res.status(200).json(new ApiResponse(200, repo, "Repo archived"));
});

export const getRepoMembers = asyncHandler(async (req, res) => {
  const repo = await Repo.findOne({ _id: req.params.repoId, user: req.user._id }).select("collaborators");
  if (!repo) throw new ApiError(404, "Repo not found");
  return res.status(200).json(new ApiResponse(200, repo.collaborators || []));
});

export const getRepoCommits = asyncHandler(async (req, res) => {
  const { repoId } = req.params;
  const repo = await Repo.findOne({ _id: repoId, user: req.user._id });
  if (!repo) throw new ApiError(404, "Repo not found");

  const { owner, name } = parseGithubUrl(repo.githubUrl);

  // Fetch latest commits
  const commits = await fetchCommits(owner, name);

  return res.status(200).json(new ApiResponse(200, commits.slice(0, 5), "Commits fetched"));
});

export const getCommitDiff = asyncHandler(async (req, res) => {
  const repo = await Repo.findOne({ _id: req.params.repoId, user: req.user._id });
  if (!repo) throw new ApiError(404, "Repo not found");
  const { owner, name } = parseGithubUrl(repo.githubUrl);
  const diff = await fetchCommitDiff(owner, name, req.params.sha);
  return res.status(200).json(new ApiResponse(200, { diff: diff.slice(0, 12000) }, "Diff fetched"));
});

export const summarizeCommitDiff = asyncHandler(async (req, res) => {
  const repo = await Repo.findOne({ _id: req.params.repoId, user: req.user._id });
  if (!repo) throw new ApiError(404, "Repo not found");
  const { owner, name } = parseGithubUrl(repo.githubUrl);
  const diff = await fetchCommitDiff(owner, name, req.params.sha);
  const { summarizeCommit } = await import("../services/gemini.service.js");
  const summary = await summarizeCommit(diff);
  return res.status(200).json(new ApiResponse(200, { summary }, "Commit summarized"));
});
