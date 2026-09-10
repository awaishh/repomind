import CommitLog from "../models/commit.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { fetchCommitDiff, fetchCommits, parseGithubUrl } from "../services/git.service.js";
import { summarizeCommitBatch } from "../services/gemini.service.js";
import { fetchCommitFiles } from "../services/git.service.js";
import Repo from "../models/repo.models.js";
import { applyCommitToIndex } from "../services/incremental-indexing.service.js";

const GITHUB_URL = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?(?:\.git)?$/;
const MAX_DIFF_LENGTH = 10000;

export const syncCommits = asyncHandler(async (req, res) => {
    const githubUrl = req.body.githubUrl?.trim();
    if (!githubUrl || !GITHUB_URL.test(githubUrl)) {
        throw new ApiError(400, "Enter a valid GitHub repository URL");
    }

    const fetchAll = req.body.fetchAll === true;
    const maxLimit = fetchAll ? 30 : 5;

    const { owner, name } = parseGithubUrl(githubUrl);
    const commits = (await fetchCommits(owner, name)).slice(0, maxLimit);
    const existingLog = await CommitLog.findOne({ user: req.user._id, githubUrl });
    const knownShas = new Set((existingLog?.commits || []).map((commit) => commit.sha));
    const newCommits = commits.filter((commit) => !knownShas.has(commit.sha));

    // There is nothing to fetch, summarize, or embed when this manual sync has
    // no unseen SHA values.
    if (newCommits.length === 0) {
        if (existingLog) {
            existingLog.syncedAt = new Date();
            await existingLog.save();
            return res.status(200).json(new ApiResponse(200, { ...existingLog.toObject(), processedCount: 0, skippedCount: commits.length }, "No new commits to process"));
        }
    }

    const commitItems = [];

    for (const commit of newCommits) {
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

    const repo = await Repo.findOne({ user: req.user._id, githubUrl });
    if (repo && repo.ragStatus === "ready") {
        for (const commit of newCommits) {
            try {
                const changes = await fetchCommitFiles(owner, name, commit.sha);
                await applyCommitToIndex(repo, changes);
            } catch (error) {
                // A commit summary is still valuable if a single file cannot be re-indexed.
                console.warn(`Incremental RAG update skipped for ${commit.sha}: ${error.message}`);
            }
        }
    }

    const allCommits = [...savedCommits, ...(existingLog?.commits || [])]
        .sort((a, b) => new Date(b.committedAt) - new Date(a.committedAt));
    const log = await CommitLog.findOneAndUpdate(
        { user: req.user._id, githubUrl },
        { user: req.user._id, githubUrl, owner, name, commits: allCommits, syncedAt: new Date() },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json(new ApiResponse(200, { ...log.toObject(), processedCount: newCommits.length, skippedCount: commits.length - newCommits.length }, "New commits synced and saved"));
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
