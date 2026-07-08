/**
 * Gemini service — direct REST API calls with model fallback on quota errors.
 */

const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-latest",
];

async function generateContent(contents) {
  const key = process.env.GEMINI_API_KEY;

  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    const errText = await res.text();

    // Quota exhausted — try next model
    if (res.status === 429) {
      console.warn(`[Gemini] ${model} quota exhausted, trying next model...`);
      continue;
    }

    throw new Error(`Gemini generateContent failed [${res.status}]: ${errText.slice(0, 300)}`);
  }

  throw new Error("All Gemini models are quota-exhausted. Please wait or enable billing.");
}

/**
 * Generate a response from Gemini given context + question.
 */
export async function askGemini(question, contextChunks, conversationHistory = []) {
  const contextText = contextChunks
    .map((c) => `--- File: ${c.filePath} (lines ${c.startLine}-${c.endLine}) ---\n${c.content}`)
    .join("\n\n");

  const systemPrompt = `You are RepoMind, an expert code assistant. You help users understand codebases.
You are given relevant code snippets from the repository. Answer the user's question based on the provided code context.
Be specific, reference file names and line numbers when relevant.
If you can't answer from the provided context, say so honestly.
Use markdown formatting for code blocks and structure your answers clearly.

RELEVANT CODE CONTEXT:
${contextText}`;

  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "I understand. I'll help you understand this codebase based on the provided context. What would you like to know?" }] },
  ];

  for (const msg of conversationHistory) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }

  contents.push({ role: "user", parts: [{ text: question }] });

  return await generateContent(contents);
}

/**
 * Summarize a README file.
 */
export async function summarizeReadme(readmeContent, repoName) {
  const prompt = `Summarize this README for the repository "${repoName}" in a clear, concise way.
Explain what the project does, its main features, tech stack, and how to get started.
Keep it to 3-5 paragraphs. Use markdown formatting.

README CONTENT:
${readmeContent.slice(0, 2000)}`;

  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  return await generateContent(contents);
}
