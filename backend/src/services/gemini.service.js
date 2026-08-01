import { askOllama, summarizeOllamaReadme, summarizeOllamaCommit, summarizeOllamaCommitBatch } from "./ollama.service.js";

const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-exp",
];
const MAX_QUESTION_CHARS = 400;
const MAX_HISTORY_CHARS = 1000;

// Simple in-memory response cache to save API quota
const responseCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCachedResponse(key) {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.value;
  }
  return null;
}

function setCachedResponse(key, value) {
  if (responseCache.size > 200) {
    const oldestKey = responseCache.keys().next().value;
    responseCache.delete(oldestKey);
  }
  responseCache.set(key, { value, timestamp: Date.now() });
}

async function generateContent(contents, maxTokens = 200) {
  const key = process.env.GEMINI_API_KEY;

  if (!key || key.includes("placeholder")) {
    throw new Error("Missing GEMINI_API_KEY in backend environment (.env). Please set a valid Gemini API Key.");
  }

  const cacheKey = JSON.stringify({ contents, maxTokens });
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    return cached;
  }

  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.2,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const output = data.candidates?.[0]?.content?.parts?.[0]?.text || "No summary available.";
        setCachedResponse(cacheKey, output);
        return output;
      }

      const errText = await res.text();

      if (res.status === 400 && (errText.includes("API key") || errText.includes("INVALID_ARGUMENT"))) {
        throw new Error("Invalid GEMINI_API_KEY. Please update your backend .env with a valid Google AI Studio key.");
      }

      // Quota exhausted — try next model
      if (res.status === 429) {
        console.warn(`[Gemini] ${model} quota exhausted, trying next model...`);
        continue;
      }

      console.warn(`[Gemini] ${model} error [${res.status}]: ${errText.slice(0, 150)}`);
    } catch (err) {
      if (err.message.includes("GEMINI_API_KEY")) throw err;
      console.warn(`[Gemini] fetch error on ${model}:`, err.message);
    }
  }

  throw new Error("AI rate limit reached. Please wait a moment before asking another question.");
}

/**
 * Generate a response from Gemini given context + question.
 */
export async function askGemini(question, contextChunks, conversationHistory = []) {
  if (process.env.USE_OLLAMA === "true") {
    return await askOllama(question, contextChunks, conversationHistory);
  }
  // Truncate context to max 3 chunks, 500 chars each to save tokens
  const contextText = contextChunks
    .slice(0, 3)
    .map((c) => `File: ${c.filePath}\n${c.content.slice(0, 500)}`)
    .join("\n\n");

  const systemPrompt = `You are RepoMind code assistant. Answer briefly using max 3 bullet points based on context:
${contextText}`;

  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Understood. Ask your question." }] },
  ];

  for (const msg of conversationHistory.slice(-2)) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content.slice(0, MAX_HISTORY_CHARS) }],
    });
  }

  contents.push({ role: "user", parts: [{ text: question.slice(0, MAX_QUESTION_CHARS) }] });

  return await generateContent(contents, 200);
}

/**
 * Summarize a README file.
 */
export async function summarizeReadme(readmeContent, repoName) {
  if (process.env.USE_OLLAMA === "true") {
    return await summarizeOllamaReadme(readmeContent, repoName);
  }
  const prompt = `Summarize repo "${repoName}" in 2 short paragraphs:\n${readmeContent.slice(0, 1200)}`;
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  return await generateContent(contents, 180);
}

/**
 * Summarize a commit diff.
 */
export async function summarizeCommit(diffContent) {
  if (process.env.USE_OLLAMA === "true") {
    return await summarizeOllamaCommit(diffContent);
  }
  const prompt = `Summarize this diff in max 2 bullet points:\n${diffContent.slice(0, 1500)}`;
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  return await generateContent(contents, 100);
}

export async function summarizeCommitBatch(commits) {
  if (process.env.USE_OLLAMA === "true") {
    return await summarizeOllamaCommitBatch(commits);
  }
  const summaries = [];
  for (const c of commits) {
    const sum = await summarizeCommit(c.diff || c.message);
    summaries.push(sum);
  }
  return summaries;
}
