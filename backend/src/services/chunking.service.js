/**
 * Smart chunking service.
 * Splits code by function/class boundaries where possible,
 * falls back to line-based chunking.
 */

const MAX_CHUNK_LINES = 100;  // larger chunks = fewer total embeddings
const OVERLAP_LINES = 3;

// Regex patterns for function/class boundaries across common languages
const BOUNDARY_PATTERNS = [
  // JavaScript / TypeScript
  /^(?:export\s+)?(?:async\s+)?function\s+\w+/,
  /^(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:\(|function)/,
  /^(?:export\s+)?class\s+\w+/,
  /^\s*(?:async\s+)?\w+\s*\(.*\)\s*\{/,
  // Python
  /^(?:async\s+)?def\s+\w+/,
  /^class\s+\w+/,
  // Java / C# / Go
  /^(?:public|private|protected|static|func)\s+/,
  // Rust
  /^(?:pub\s+)?(?:fn|struct|enum|impl|trait)\s+/,
  // Ruby
  /^(?:def|class|module)\s+/,
];

function isBoundary(line) {
  const trimmed = line.trimStart();
  return BOUNDARY_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Chunk a file's content intelligently.
 * Returns array of { content, startLine, endLine }
 */
export function chunkFileContent(content, filePath) {
  const lines = content.split("\n");

  // If file is small enough, treat it as a single chunk
  if (lines.length <= MAX_CHUNK_LINES) {
    // Skip files that are too tiny to be useful
    if (lines.filter(l => l.trim()).length < 5) return [];
    return [{ content, startLine: 1, endLine: lines.length }];
  }

  const chunks = [];
  let currentChunkStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const chunkLength = i - currentChunkStart;

    // If we've exceeded max chunk size, look for a good break point
    if (chunkLength >= MAX_CHUNK_LINES) {
      // Look ahead a few lines for a boundary
      let breakAt = i;
      for (let j = i; j < Math.min(i + 10, lines.length); j++) {
        if (isBoundary(lines[j])) {
          breakAt = j;
          break;
        }
      }

      const chunkLines = lines.slice(currentChunkStart, breakAt);
      if (chunkLines.length > 0) {
        chunks.push({
          content: chunkLines.join("\n"),
          startLine: currentChunkStart + 1,
          endLine: breakAt,
        });
      }

      // Start next chunk with overlap
      currentChunkStart = Math.max(breakAt - OVERLAP_LINES, currentChunkStart + 1);
    }
    // Also break at boundaries if we have at least 15 lines
    else if (chunkLength >= 15 && isBoundary(lines[i])) {
      const chunkLines = lines.slice(currentChunkStart, i);
      if (chunkLines.length > 0) {
        chunks.push({
          content: chunkLines.join("\n"),
          startLine: currentChunkStart + 1,
          endLine: i,
        });
      }
      currentChunkStart = Math.max(i - OVERLAP_LINES, currentChunkStart + 1);
    }
  }

  // Remaining lines
  if (currentChunkStart < lines.length) {
    const chunkLines = lines.slice(currentChunkStart);
    if (chunkLines.length > 0) {
      chunks.push({
        content: chunkLines.join("\n"),
        startLine: currentChunkStart + 1,
        endLine: lines.length,
      });
    }
  }

  return chunks;
}
