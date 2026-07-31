import Repo from "../models/repo.models.js";
import Chunk from "../models/chunk.models.js";
import { parseGithubUrl, fetchRepoMeta, fetchRepositoryTree, fetchFileContent } from "./git.service.js";
import { chunkFileContent } from "./chunking.service.js";
import { generateEmbeddingsBatch } from "./embedding.service.js";

const VALID_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".py", ".go", ".rs", ".java", ".cpp", ".c", ".h"];
const IGNORED_FILES = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", ".min.js"];
const MAX_FILES = 15;
const MAX_CHUNKS = 25;

export async function indexRepository(repo) {
    if (repo.ragStatus === "processing") return;

    repo.ragStatus = "processing";
    await repo.save();

    try {
        const { owner, name } = parseGithubUrl(repo.githubUrl);
        const meta = await fetchRepoMeta(owner, name);
        const branch = meta.defaultBranch || "main";
        const treeFiles = await fetchRepositoryTree(owner, name, branch);
        const processableFiles = treeFiles
            .filter((file) => VALID_EXTENSIONS.includes(file.name.slice(file.name.lastIndexOf("."))))
            .slice(0, MAX_FILES);

        await Chunk.deleteMany({ repo: repo._id });
        const allChunks = [];

        for (const file of processableFiles) {
            if (allChunks.length >= MAX_CHUNKS) break;
            try {
                const content = await fetchFileContent(owner, name, file.sha);
                if (!content.trim()) continue;
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

        if (allChunks.length > 0) {
            const embeddings = await generateEmbeddingsBatch(
                allChunks.map((chunk) => `File: ${chunk.filePath}\n${chunk.content}`)
            );
            for (let i = 0; i < allChunks.length; i += 1) {
                allChunks[i].embedding = embeddings[i] || [];
            }
            await Chunk.insertMany(allChunks);
        }

        repo.totalFiles = processableFiles.length;
        repo.totalChunks = allChunks.length;
        repo.ragStatus = "ready";
        await repo.save();
    } catch (error) {
        repo.ragStatus = "error";
        await repo.save();
        throw error;
    }
}
