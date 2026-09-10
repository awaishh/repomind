import Chunk from "../models/chunk.models.js";
import { chunkFileContent } from "./chunking.service.js";
import { generateEmbeddingsBatch } from "./embedding.service.js";
import { fetchFileContent } from "./git.service.js";

const VALID_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".py", ".go", ".rs", ".java", ".cpp", ".c", ".h",
  ".html", ".css", ".json", ".md", ".txt", ".php", ".rb", ".sh", ".sql",
]);

const isProcessable = (path) => VALID_EXTENSIONS.has(path.slice(path.lastIndexOf(".")).toLowerCase());

/**
 * Replace vectors for only the files touched by one commit. The initial index
 * remains responsible for repositories that have not yet been indexed.
 */
export async function applyCommitToIndex(repo, changes) {
  if (repo.ragStatus !== "ready") return { updatedFiles: 0, skipped: true };

  const replacements = [];
  for (const change of changes) {
    const stalePaths = [change.path, change.previousPath].filter(Boolean);
    if (stalePaths.length) await Chunk.deleteMany({ repo: repo._id, filePath: { $in: stalePaths } });

    if (change.status === "removed" || !change.sha || !isProcessable(change.path)) continue;

    const content = await fetchFileContent(repo.owner, repo.name, change.sha);
    const chunks = await chunkFileContent(content, change.path);
    chunks.forEach((chunk, chunkIndex) => replacements.push({
      repo: repo._id,
      filePath: change.path,
      fileName: change.path.split("/").pop(),
      content: chunk.content.slice(0, 10000),
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      chunkIndex,
      embedding: [],
    }));
  }

  if (replacements.length) {
    const embeddings = await generateEmbeddingsBatch(replacements.map((chunk) => `File: ${chunk.filePath}\n${chunk.content}`));
    replacements.forEach((chunk, index) => { chunk.embedding = embeddings[index] || []; });
    await Chunk.insertMany(replacements);
  }

  repo.totalChunks = await Chunk.countDocuments({ repo: repo._id });
  await repo.save();
  return { updatedFiles: new Set(changes.map((change) => change.path)).size, skipped: false };
}
