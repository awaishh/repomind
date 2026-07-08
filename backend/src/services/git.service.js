import simpleGit from "simple-git";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Clone a GitHub repo (shallow) into a temp directory.
 * Returns the local clone path.
 */
export async function cloneRepo(githubUrl) {
  const repoName = githubUrl.split("/").pop().replace(".git", "");
  const cloneDir = path.join(os.tmpdir(), `repomind_${repoName}_${Date.now()}`);

  const git = simpleGit();
  await git.clone(githubUrl, cloneDir, ["--depth", "1"]);

  return cloneDir;
}

/**
 * Clean up a cloned repo directory.
 */
export function cleanupClone(cloneDir) {
  try {
    if (fs.existsSync(cloneDir)) {
      fs.rmSync(cloneDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error("Cleanup error:", err.message);
  }
}

/**
 * Extract owner and repo name from a GitHub URL.
 * Supports formats:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   git@github.com:owner/repo.git
 */
export function parseGithubUrl(url) {
  const cleaned = url.replace(/\.git$/, "").replace(/\/$/, "");
  const parts = cleaned.split("/");
  const name = parts.pop();
  const owner = parts.pop();
  return { owner, name };
}

/**
 * Fetch basic repo metadata from GitHub API (public repos only).
 */
export async function fetchRepoMeta(owner, name) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${name}`);
    if (!res.ok) return {};
    const data = await res.json();
    return {
      description: data.description || "",
      language: data.language || "",
      stars: data.stargazers_count || 0,
    };
  } catch {
    return {};
  }
}
