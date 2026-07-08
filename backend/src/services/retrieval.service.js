import Chunk from "../models/chunk.models.js";
import { generateEmbedding } from "./embedding.service.js";
import { AUTH_PATTERNS } from "../constants.js";

/**
 * Perform vector similarity search over chunks for a given repo.
 * Optionally filter by specific file paths (context scope).
 * Optionally bias toward auth-related files.
 */
export async function searchChunks(repoId, query, options = {}) {
  const { scopedFiles = [], topK = 8, biasAuth = false } = options;

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Build the vector search pipeline
  const pipeline = [];

  // Try Atlas Vector Search first
  try {
    const vectorSearchStage = {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: topK * 10,
        limit: topK * 3,
        filter: {
          repo: repoId,
        },
      },
    };

    // If scoped files are provided, add file filter
    if (scopedFiles.length > 0) {
      vectorSearchStage.$vectorSearch.filter = {
        $and: [
          { repo: repoId },
          { filePath: { $in: scopedFiles } },
        ],
      };
    }

    pipeline.push(vectorSearchStage);
    pipeline.push({
      $addFields: { score: { $meta: "vectorSearchScore" } },
    });
    pipeline.push({ $limit: topK });

    const results = await Chunk.aggregate(pipeline);

    if (results.length > 0) {
      return results;
    }
  } catch (err) {
    console.warn("Atlas Vector Search not available, falling back to manual search:", err.message);
  }

  // Fallback: manual cosine similarity (for when Atlas Vector Search index isn't set up)
  const filter = { repo: repoId, embedding: { $exists: true, $ne: [] } };
  if (scopedFiles.length > 0) {
    filter.filePath = { $in: scopedFiles };
  }

  let chunks = await Chunk.find(filter).lean();

  // If biasing for auth, boost auth-related files
  if (biasAuth) {
    chunks = chunks.map((chunk) => {
      const isAuth = AUTH_PATTERNS.some((p) =>
        chunk.filePath.toLowerCase().includes(p)
      );
      return { ...chunk, authBoost: isAuth ? 0.1 : 0 };
    });
  }

  // Compute cosine similarity manually
  const scored = chunks.map((chunk) => {
    const sim = cosineSimilarity(queryEmbedding, chunk.embedding);
    return {
      ...chunk,
      score: sim + (chunk.authBoost || 0),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}

/**
 * Check if a query is auth-related.
 */
export function isAuthQuery(query) {
  const lower = query.toLowerCase();
  return AUTH_PATTERNS.some((p) => lower.includes(p));
}
