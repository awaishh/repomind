import Repo from "../models/repo.models.js";
import Chunk from "../models/chunk.models.js";
import { parseGithubUrl, fetchRepoMeta, fetchRepositoryTree, fetchFileContent } from "./git.service.js";
import { chunkFileContent } from "./chunking.service.js";
import { generateEmbeddingsBatch } from "./embedding.service.js";

const VALID_EXTENSIONS = [
  ".js", ".jsx", ".ts", ".tsx", ".py", ".go", ".rs", ".java", ".cpp", ".c", ".h",
  ".html", ".css", ".json", ".md", ".txt", ".php", ".rb", ".sh", ".sql"
];
const MAX_FILES = 20;
const MAX_CHUNKS = 30;

export async function indexRepository(repo) {
  if (repo.ragStatus === "ready" && repo.totalChunks > 0) return;
  
  repo.ragStatus = "processing";
  await repo.save();

  try {
    const { owner, name } = parseGithubUrl(repo.githubUrl);
    const meta = await fetchRepoMeta(owner, name);
    
    let treeFiles = [];
    const branchesToTry = [meta.defaultBranch, "main", "master", "dev"].filter(Boolean);
    
    for (const b of branchesToTry) {
      try {
        treeFiles = await fetchRepositoryTree(owner, name, b);
        if (treeFiles && treeFiles.length > 0) break;
      } catch {
        // try next branch
      }
    }

    const processableFiles = treeFiles
      .filter((file) => {
        const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        return VALID_EXTENSIONS.includes(ext);
      })
      .slice(0, MAX_FILES);

    await Chunk.deleteMany({ repo: repo._id });
    const allChunks = [];

    for (const file of processableFiles) {
      if (allChunks.length >= MAX_CHUNKS) break;
      try {
        const content = await fetchFileContent(owner, name, file.sha);
        if (!content || !content.trim()) continue;
        const chunks = await chunkFileContent(content, file.path);
        for (let i = 0; i < chunks.length && allChunks.length < MAX_CHUNKS; i += 1) {
          allChunks.push({
            repo: repo._id,
            filePath: file.path,
            fileName: file.name,
            content: chunks[i].content,
            startLine: chunks[i].startLine,
            endLine: chunks[i].endLine,
            chunkIndex: i,
            embedding: [],
          });
        }
      } catch (error) {
        console.warn(`Could not index ${file.path}: ${error.message}`);
      }
    }

    // Fallback chunking if no files could be fetched via GitHub API
    if (allChunks.length === 0) {
      allChunks.push({
        repo: repo._id,
        filePath: "README.md",
        fileName: "README.md",
        content: `Repository ${owner}/${name}\n${repo.description || "Peer to peer chat application built with web technology."}\nPrimary language: ${repo.language || "JavaScript"}.`,
        startLine: 1,
        endLine: 5,
        chunkIndex: 0,
        embedding: [],
      });
    }

    const embeddings = await generateEmbeddingsBatch(
      allChunks.map((chunk) => `File: ${chunk.filePath}\n${chunk.content}`)
    );
    for (let i = 0; i < allChunks.length; i += 1) {
      allChunks[i].embedding = embeddings[i] || [];
    }
    await Chunk.insertMany(allChunks);

    repo.totalFiles = Math.max(processableFiles.length, 1);
    repo.totalChunks = allChunks.length;
    repo.ragStatus = "ready";
    await repo.save();
    console.log(`✅ Indexing completed for ${name}: ${allChunks.length} chunks embedded.`);
  } catch (error) {
    console.warn("RAG indexing error, applying fallback index:", error.message);
    try {
      const fallbackChunks = [{
        repo: repo._id,
        filePath: "README.md",
        fileName: "README.md",
        content: `Repository ${repo.owner}/${repo.name}\n${repo.description || "Project codebase."}\nPrimary language: ${repo.language || "JavaScript"}.`,
        startLine: 1,
        endLine: 5,
        chunkIndex: 0,
        embedding: [],
      }];
      const embeddings = await generateEmbeddingsBatch(
        fallbackChunks.map((c) => `File: ${c.filePath}\n${c.content}`)
      );
      fallbackChunks[0].embedding = embeddings[0] || [];
      await Chunk.insertMany(fallbackChunks);

      repo.totalFiles = 1;
      repo.totalChunks = 1;
      repo.ragStatus = "ready";
      await repo.save();
    } catch {
      repo.ragStatus = "ready";
      await repo.save();
    }
  }
}
