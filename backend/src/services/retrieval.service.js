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

  // Generate query embedding with fallback
  let queryEmbedding = null;
  try {
    queryEmbedding = await generateEmbedding(query);
  } catch (err) {
    console.warn("Embedding generation unavailable/rate-limited, using text keyword matching fallback:", err.message);
  }

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

  // Fallback: manual cosine similarity or keyword text match
  const filter = { repo: repoId };
  if (scopedFiles.length > 0) {
    filter.filePath = { $in: scopedFiles };
  }

  let chunks = await Chunk.find(filter).lean();
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);

  const scored = chunks.map((chunk) => {
    let score = 0;
    if (queryEmbedding && chunk.embedding?.length) {
      score = cosineSimilarity(queryEmbedding, chunk.embedding);
    } else {
      // Keyword occurrence score
      const text = (chunk.filePath + " " + chunk.content).toLowerCase();
      score = keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 0.2 : 0), 0);
    }
    return { ...chunk, score };
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
