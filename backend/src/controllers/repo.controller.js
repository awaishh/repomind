import Repo from "../models/repo.models.js";
import Chunk from "../models/chunk.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  cloneRepo,
  cleanupClone,
  parseGithubUrl,
  fetchRepoMeta,
} from "../services/git.service.js";
import {
  parseFileTree,
  readFileContent,
  getReadmeContent,
  getProcessableFiles,
} from "../services/fileTree.service.js";
import { chunkFileContent } from "../services/chunking.service.js";
import { generateEmbeddingsBatch } from "../services/embedding.service.js";
import { summarizeReadme } from "../services/gemini.service.js";

/**
 * Clone a repo, parse file tree, chunk files, generate embeddings.
 * This is the main pipeline — runs in background after initial response.
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
      .json(new ApiResponse(200, existing, "Repo already processed"));
  }

  // Create repo document with "cloning" status
  const repo = existing || await Repo.create({
    user: userId,
    githubUrl,
    name,
    owner,
    status: "cloning",
  });

  if (existing) {
    repo.status = "cloning";
    repo.errorMessage = "";
    await repo.save();
  }

  // Return immediately — processing happens in background
  res
    .status(202)
    .json(new ApiResponse(202, { repoId: repo._id, status: "cloning" }, "Cloning started"));

  // ---- Background processing ----
  let cloneDir = null;
  try {
    // 1. Fetch GitHub metadata
    const meta = await fetchRepoMeta(owner, name);
    repo.description = meta.description || "";
    repo.language = meta.language || "";
    repo.stars = meta.stars || 0;

    // 2. Clone the repo
    cloneDir = await cloneRepo(githubUrl);
    repo.status = "parsing";
    await repo.save();

    // 3. Parse file tree
    const fileTree = parseFileTree(cloneDir);
    repo.fileTree = fileTree;

    // 4. Get & summarize README
    const readmeContent = getReadmeContent(cloneDir);
    if (readmeContent) {
      try {
        repo.readmeSummary = await summarizeReadme(readmeContent, name);
      } catch (err) {
        console.error("README summarization error:", err.message);
        repo.readmeSummary = "Unable to summarize README. Please ask questions about the code directly.";
      }
    }

    repo.status = "embedding";
    await repo.save();

    // 5. Chunk all processable files
    const processableFiles = getProcessableFiles(fileTree);
    repo.totalFiles = processableFiles.length;

    // Delete old chunks if re-processing
    await Chunk.deleteMany({ repo: repo._id });

    const allChunks = [];
    for (const file of processableFiles) {
      const content = readFileContent(cloneDir, file.path);
      if (!content.trim()) continue;

      const chunks = chunkFileContent(content, file.path);
      for (let i = 0; i < chunks.length; i++) {
        allChunks.push({
          repo: repo._id,
          filePath: file.path,
          fileName: file.name,
          content: chunks[i].content,
          startLine: chunks[i].startLine,
          endLine: chunks[i].endLine,
          chunkIndex: i,
          embedding: [],
        });
      }
    }

    // 6. Generate embeddings in batches
    const texts = allChunks.map(
      (c) => `File: ${c.filePath}\n${c.content}`
    );

    if (texts.length > 0) {
      const embeddings = await generateEmbeddingsBatch(texts);
      for (let i = 0; i < allChunks.length; i++) {
        allChunks[i].embedding = embeddings[i] || [];
      }
    }

    // 7. Save all chunks to DB
    if (allChunks.length > 0) {
      await Chunk.insertMany(allChunks);
    }

    repo.totalChunks = allChunks.length;
    repo.status = "ready";
    await repo.save();

    console.log(`✅ Repo ${name} processed: ${processableFiles.length} files, ${allChunks.length} chunks`);
  } catch (err) {
    console.error("Repo processing error:", err);
    repo.status = "error";
    repo.errorMessage = err.message;
    await repo.save();
  } finally {
    if (cloneDir) cleanupClone(cloneDir);
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
  const repos = await Repo.find({ user: req.user._id })
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

  const cloneDir = await cloneRepo(repo.githubUrl);
  try {
    const content = readFileContent(cloneDir, filePath);
    return res.status(200).json(new ApiResponse(200, { content }));
  } finally {
    cleanupClone(cloneDir);
  }
});
