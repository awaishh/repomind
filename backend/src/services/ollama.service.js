/**
 * Ollama service — 100% local AI inference and embeddings (http://localhost:11434).
 * Unlimited usage, zero rate limits, zero API keys.
 */

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || "qwen2.5-coder";
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

/**
 * Generate chat response from local Ollama model.
 */
export async function askOllama(question, contextChunks, conversationHistory = []) {
  const contextText = contextChunks
    .slice(0, 4)
    .map((c) => `File: ${c.filePath}\n${c.content.slice(0, 800)}`)
    .join("\n\n");

  const prompt = `You are RepoMind code assistant. Answer the user's question concisely using max 3 bullet points based on the code context.

CODE CONTEXT:
${contextText}

QUESTION:
${question}`;

  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CHAT_MODEL,
      prompt,
      stream: false,
      options: {
        num_predict: 250,
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama chat failed [${res.status}]. Make sure Ollama is running ('ollama run ${CHAT_MODEL}').`);
  }

  const data = await res.json();
  return data.response?.trim() || "No response received from Ollama.";
}

/**
 * Generate embedding for a single text using Ollama (nomic-embed-text).
 * Returns 768-dimensional float array.
 */
export async function generateOllamaEmbedding(text) {
  const res = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBED_MODEL,
      prompt: text.slice(0, 1000),
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama embedding failed [${res.status}]. Make sure model is pulled ('ollama pull ${EMBED_MODEL}').`);
  }

  const data = await res.json();
  return data.embedding || [];
}

/**
 * Batch embeddings using local Ollama.
 */
export async function generateOllamaEmbeddingsBatch(texts) {
  const embeddings = [];
  for (const text of texts) {
    const emb = await generateOllamaEmbedding(text);
    embeddings.push(emb);
  }
  return embeddings;
}

/**
 * Summarize README using local Ollama.
 */
export async function summarizeOllamaReadme(readmeContent, repoName) {
  const prompt = `Summarize the README for repository "${repoName}" in 2 short paragraphs explaining what it does, tech stack, and setup:\n\n${readmeContent.slice(0, 1500)}`;
  
  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CHAT_MODEL,
      prompt,
      stream: false,
      options: { num_predict: 200, temperature: 0.2 },
    }),
  });

  if (!res.ok) return `Repository ${repoName} contains source code and documentation.`;
  const data = await res.json();
  return data.response?.trim() || `Repository ${repoName} codebase overview.`;
}

/**
 * Summarize git diff using local Ollama.
 */
export async function summarizeOllamaCommit(diffContent) {
  const prompt = `Summarize this git diff in 2 short bullet points:\n\n${diffContent.slice(0, 1500)}`;

  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CHAT_MODEL,
      prompt,
      stream: false,
      options: { num_predict: 120, temperature: 0.2 },
    }),
  });

  if (!res.ok) return "Code changes and updates.";
  const data = await res.json();
  return data.response?.trim() || "Code changes and updates.";
}

/**
 * Batch summarize commits using local Ollama.
 */
export async function summarizeOllamaCommitBatch(commits) {
  const summaries = [];
  for (const c of commits.slice(0, 5)) {
    const sum = await summarizeOllamaCommit(c.diff || c.message);
    summaries.push(sum);
  }
  return summaries;
}
