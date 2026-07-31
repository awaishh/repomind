import CommitLog from "../models/commit.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { fetchCommitDiff, fetchCommits, parseGithubUrl } from "../services/git.service.js";
import { summarizeCommitBatch } from "../services/gemini.service.js";

const GITHUB_URL = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?(?:\.git)?$/;
const MAX_COMMITS = 5;
const MAX_DIFF_LENGTH = 2200;

export const syncCommits = asyncHandler(async (req, res) => {
    const githubUrl = req.body.githubUrl?.trim();
    if (!githubUrl || !GITHUB_URL.test(githubUrl)) {
        throw new ApiError(400, "Enter a valid GitHub repository URL");
    }

    const { owner, name } = parseGithubUrl(githubUrl);
    const commits = (await fetchCommits(owner, name)).slice(0, MAX_COMMITS);
    const commitItems = [];

    for (const commit of commits) {
        try {
            const diff = await fetchCommitDiff(owner, name, commit.sha);
            commitItems.push({ ...commit, diff: diff.slice(0, MAX_DIFF_LENGTH) });
        } catch {
            commitItems.push({ ...commit, diff: "Diff unavailable for this commit." });
        }
    }

    let summaries = [];
    try {
        summaries = await summarizeCommitBatch(commitItems);
    } catch (error) {
        console.warn(`Commit summary skipped: ${error.message}`);
    }

    const savedCommits = commitItems.map((commit, index) => ({
        ...commit,
        summary: summaries[index] || "Summary unavailable. Open the diff to inspect the change.",
    }));

    const log = await CommitLog.findOneAndUpdate(
        { user: req.user._id, githubUrl },
        { user: req.user._id, githubUrl, owner, name, commits: savedCommits, syncedAt: new Date() },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json(new ApiResponse(200, log, "Commits synced and saved"));
});

export const getSavedCommits = asyncHandler(async (req, res) => {
    const logs = await CommitLog.find({ user: req.user._id }).sort({ syncedAt: -1 });
    return res.status(200).json(new ApiResponse(200, logs));
});

export const deleteSavedCommits = asyncHandler(async (req, res) => {
    const log = await CommitLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!log) throw new ApiError(404, "Commit workspace not found");
    return res.status(200).json(new ApiResponse(200, {}, "Commit workspace deleted"));
});
