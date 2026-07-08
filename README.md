# RepoMind

RepoMind is an AI-enabled repository explorer and editor built for code understanding and rapid navigation. The application combines a React-based frontend with an Express backend to provide repository cloning, semantic indexing, code browsing, and AI-assisted code exploration.

## Core capabilities

- Clone public GitHub repositories and build a repository index.
- Parse repository file trees and extract code structure.
- Chunk source files and generate semantic embeddings for retrieval.
- Provide a full-page code editor interface with Monaco editor.
- Supply an AI chat assistant that answers questions grounded in the repository content.
- Support local folder browsing alongside cloned repository exploration.
- Authenticate users and manage per-user repository state.

## Architecture

The repository is organized as a two-part application:

- `backend/`
  - Express server exposing authenticated API endpoints.
  - MongoDB storage for users, repos, chunks, and chat history.
  - GitHub repo cloning, file parsing, embedding generation, and AI interaction.

- `frontend/`
  - Vite-powered React application.
  - Authenticated dashboard, repository viewer, and code editor.
  - Monaco editor integration for a native code editing experience.
  - UI components designed for code-centric workflows.

## Technology stack

- Node.js, Express, MongoDB, Mongoose
- React, Vite, Tailwind CSS, Zustand
- Monaco Editor via `@monaco-editor/react`
- GitHub repository cloning via `simple-git`
- Google Gemini REST API for AI generation and README summarization
- JWT authentication and secure cookie handling

## Prerequisites

- Node.js 18+ installed
- MongoDB instance or connection string
- Google Gemini API key
- Git available on the host machine

## Backend setup

1. Change to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in `backend/` with the following variables:

```env
MONGO_URI=your-mongodb-connection-string
ACCESS_TOKEN_SECRET=strong-jwt-access-secret
REFRESH_TOKEN_SECRET=strong-jwt-refresh-secret
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your-google-gemini-api-key
PORT=8000
```

4. Start the backend server:

```bash
npm run dev
```

The backend listens on port `8000` by default.

## Frontend setup

1. Change to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the frontend development server:

```bash
npm run dev
```

The frontend proxies `/api` requests to `http://localhost:8000`.

## Development workflow

- Use the dashboard to register or log in.
- Clone a public GitHub repository using the repository URL.
- Wait for the repo processing pipeline to complete.
- Open the repository in the workspace viewer or in the code editor.
- Ask questions in the chat panel to get AI-assisted explanations.
- Open local folders in the editor to inspect local files without cloning.

## Application behavior

### Repository processing

When a repository is cloned, the backend performs these steps:

- parses repository metadata and file structure
- extracts a README summary
- identifies processable code files
- chunks file content for semantic retrieval
- generates embeddings for each chunk

The repository remains available in the user’s dashboard while indexing occurs in the background.

### AI assistant

The AI assistant uses Gemini to answer repository-specific questions. It receives relevant code chunks and conversation history, then returns a grounded response.

### File retrieval

The editor can fetch individual file content from a cloned repository using the backend endpoint:

- `GET /api/v1/repo/:repoId/file?path=<filePath>`

## Project structure

- `backend/src/controllers` - request handlers for auth, repository operations, and chat.
- `backend/src/services` - repository cloning, parsing, embedding, retrieval, and Gemini integration.
- `backend/src/models` - MongoDB schemas for users, repositories, chunks, and chats.
- `frontend/src/pages` - React page views for landing, auth, dashboard, repo view, and editor.
- `frontend/src/components` - reusable UI elements and chat/canvas components.
- `frontend/src/store` - state management for authentication and repository workflows.

## Notes

- The backend requires an active MongoDB connection and a valid Gemini API key to fully enable AI features.
- Local folder browsing in the editor works with browser file input selection and does not require backend cloning.
- The repository processing pipeline is designed for public GitHub URLs only.

## Recommended commands

From `backend/`:

```bash
npm run dev
```

From `frontend/`:

```bash
npm run dev
```

## Contact

Refer to repository source and comments for implementation details. The application is built for rapid codebase exploration, AI-assisted understanding, and developer-focused repository navigation.