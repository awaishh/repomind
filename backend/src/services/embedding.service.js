import { generateOllamaEmbedding, generateOllamaEmbeddingsBatch } from "./ollama.service.js";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001";

export async function generateEmbedding(text) {
  if (process.env.USE_OLLAMA === "true") {
    return await generateOllamaEmbedding(text);
  }

  try {
    const res = await fetchWithRetry(`${BASE}:embedContent`, {
      method: "POST",
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text }] },
      }),
    });
    const data = await res.json();
    return data.embedding.values;
  } catch (err) {
    console.warn("Gemini embedding failed, attempting local Ollama embedding...", err.message);
    return await generateOllamaEmbedding(text);
  }
}

async function fetchWithRetry(url, options, retries = 3) {
  const key = process.env.GEMINI_API_KEY;

  // x-goog-api-key header works for both AQ. and AIza. key formats
  const headers = {
    "Content-Type": "application/json",
    "x-goog-api-key": key,
    ...options.headers,
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { ...options, headers });

    if (res.ok) return res;

    const body = await res.text();

    if (res.status === 429 || res.status === 503) {
      if (attempt < retries) {
        const delay = (attempt + 1) * 5000;
        console.warn(`Embedding quota hit, retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    }

    throw new Error(`Embedding API error [${res.status}]: ${body.slice(0, 200)}`);
  }
}



export async function generateEmbeddingsBatch(texts, batchSize = 10) {
  if (process.env.USE_OLLAMA === "true") {
    return await generateOllamaEmbeddingsBatch(texts);
  }

  try {
    const allEmbeddings = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      const res = await fetchWithRetry(`${BASE}:batchEmbedContents`, {
        method: "POST",
        body: JSON.stringify({
          requests: batch.map((text) => ({
            model: "models/gemini-embedding-001",
            content: { parts: [{ text }] },
          })),
        }),
      });

      const data = await res.json();
      allEmbeddings.push(...data.embeddings.map((e) => e.values));

      if (i + batchSize < texts.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return allEmbeddings;
  } catch (err) {
    console.warn("Gemini batch embedding failed, falling back to local Ollama batch embedding...", err.message);
    return await generateOllamaEmbeddingsBatch(texts);
  }
}
