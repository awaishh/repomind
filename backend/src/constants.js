export const DB_NAME = "RepoMind";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Directories/files to strip before processing a cloned repo
export const EXCLUDED_DIRS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "__pycache__",
  ".cache",
  "coverage",
  ".vscode",
  ".idea",
  "vendor",
  "tmp",
  ".turbo",
];

export const EXCLUDED_FILES = [
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  "composer.lock",
  "Gemfile.lock",
  "Pipfile.lock",
  "poetry.lock",
];

export const BINARY_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg",
  ".webp", ".mp4", ".mp3", ".wav", ".avi", ".mov",
  ".pdf", ".zip", ".tar", ".gz", ".rar", ".7z",
  ".exe", ".dll", ".so", ".dylib", ".woff", ".woff2",
  ".ttf", ".eot", ".otf", ".class", ".pyc",
];

export const MAX_FILE_SIZE_BYTES = 30 * 1024; // 30 KB - skip large files to save quota

// Patterns for auth-related files (used for biased retrieval)
export const AUTH_PATTERNS = [
  "auth", "jwt", "passport", "login", "session",
  "signup", "register", "token", "middleware/auth",
  "guard", "protect", "verify",
];
