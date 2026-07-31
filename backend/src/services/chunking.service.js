import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function chunkFileContent(content, filePath) {
  // If file is tiny, treat it as a single chunk
  const lines = content.split("\n");
  if (lines.length < 5 && lines.filter(l => l.trim()).length < 5) return [];

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 200,
  });

  const rawChunks = await splitter.createDocuments([content]);
  
  return rawChunks.map(chunk => ({
    content: chunk.pageContent,
    startLine: 1, // LangChain doesn't preserve line numbers easily, but we can set 1 or calculate
    endLine: lines.length,
  }));
}
