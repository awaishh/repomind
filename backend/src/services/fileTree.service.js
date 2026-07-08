import fs from "fs";
import path from "path";
import {
  EXCLUDED_DIRS,
  EXCLUDED_FILES,
  BINARY_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
} from "../constants.js";

/**
 * Walk the cloned repo directory and produce a flat file tree array.
 * Each entry: { path, name, type, extension, size, children }
 */
export function parseFileTree(rootDir, basePath = "") {
  const results = [];

  function walk(currentDir, relativePath) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    const children = [];

    for (const entry of entries) {
      const entryRelPath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;

      // Skip excluded directories
      if (entry.isDirectory() && EXCLUDED_DIRS.includes(entry.name)) {
        continue;
      }

      // Skip excluded files
      if (entry.isFile() && EXCLUDED_FILES.includes(entry.name)) {
        continue;
      }

      // Skip hidden files/dirs (starting with .)
      if (entry.name.startsWith(".")) {
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        children.push(entryRelPath);
        walk(fullPath, entryRelPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();

        // Skip binary files
        if (BINARY_EXTENSIONS.includes(ext)) {
          continue;
        }

        const stat = fs.statSync(fullPath);

        // Skip huge files
        if (stat.size > MAX_FILE_SIZE_BYTES) {
          continue;
        }

        children.push(entryRelPath);

        results.push({
          path: entryRelPath,
          name: entry.name,
          type: "file",
          extension: ext,
          size: stat.size,
          children: [],
        });
      }
    }

    // Add directory entry
    results.push({
      path: relativePath || ".",
      name: relativePath ? path.basename(relativePath) : path.basename(rootDir),
      type: "directory",
      extension: "",
      size: 0,
      children,
    });
  }

  walk(rootDir, basePath);
  return results;
}

/**
 * Read the content of a file from the cloned repo.
 */
export function readFileContent(rootDir, relPath) {
  const fullPath = path.join(rootDir, relPath);
  try {
    return fs.readFileSync(fullPath, "utf-8");
  } catch {
    return "";
  }
}

/**
 * Get the README content from a cloned repo (tries common README names).
 */
export function getReadmeContent(rootDir) {
  const candidates = [
    "README.md",
    "readme.md",
    "Readme.md",
    "README.rst",
    "README.txt",
    "README",
  ];
  for (const name of candidates) {
    const fp = path.join(rootDir, name);
    if (fs.existsSync(fp)) {
      return fs.readFileSync(fp, "utf-8");
    }
  }
  return "";
}

/**
 * Get all processable files from the file tree (only files, not dirs).
 */
export function getProcessableFiles(fileTree) {
  return fileTree.filter((node) => node.type === "file");
}
