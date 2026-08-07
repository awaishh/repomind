<div align="center">

<br/>

<img src="https://img.shields.io/badge/REPO-MIND-000000?style=for-the-badge&labelColor=000000&color=white" alt="RepoMind" height="40"/>

<br/><br/>

### AI-Powered Repository Intelligence Platform

<p align="center">
<em>Link any GitHub repo. Explore it visually. Chat with an AI that has actually read every line of code.</em>
</p>

<br/>

<p align="center">
<img src="https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=000" alt="React"/>
<img src="https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=fff" alt="Vite"/>
<img src="https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=fff" alt="Express"/>
<img src="https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=fff" alt="MongoDB"/>
<img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=flat-square&logo=googlegemini&logoColor=fff" alt="Gemini"/>
<img src="https://img.shields.io/badge/AssemblyAI-FF6B00?style=flat-square&logo=data:image/svg+xml;base64,&logoColor=fff" alt="AssemblyAI"/>
<img src="https://img.shields.io/badge/License-MIT-22c55e?style=flat-square" alt="License"/>
</p>

<br/>

---

</div>

<br/>

## ✦ Overview

**RepoMind** is a full-stack developer intelligence platform that transforms how engineers understand, navigate, and collaborate on codebases. It combines **vector-powered semantic search**, **interactive code visualization**, **AI commit analysis**, and **meeting transcription** into a single, cohesive workspace.

Built on a decoupled architecture that separates lightweight repository metadata linking from compute-heavy vector indexing — delivering instant repository onboarding while deferring expensive embedding generation to lazy execution cycles.

<br/>

## ✦ Core Capabilities

<table>
<tr>
<td width="50%">

### 🧠 RAG-Powered Code Q&A
Ask natural language questions about any codebase. RepoMind chunks source files into semantic blocks, embeds them into 768-dimensional vector space via MongoDB Atlas Vector Search, and retrieves the most relevant context for Gemini to generate precise, source-referenced answers.

</td>
<td width="50%">

### 🌳 Interactive Repository Canvas
Explore repository structure as a dynamic, zoomable node graph powered by **React Flow**. Click into directories, inspect file hierarchies, and navigate complex codebases visually — no terminal required.

</td>
</tr>
<tr>
<td width="50%">

### 📊 Git Diff Intelligence
Fetch commit histories directly from GitHub, view file-level diffs inline, and generate AI-powered change summaries. Understand what changed, why it matters, and what areas of the codebase were impacted — all from a single interface.

</td>
<td width="50%">

### 🎙️ Meeting Room (AssemblyAI)
Upload audio recordings of standups, code reviews, or technical discussions. AssemblyAI processes speaker diarization, auto-chaptering, and NLP topic segmentation — producing full transcripts, key takeaways, action items, and executive summaries.

</td>
</tr>
<tr>
<td width="50%">

### 👥 Team Collaboration
Invite collaborators via email, manage workspace access, and share repository intelligence across your team. Built-in invitation workflows and role-based access control.

</td>
<td width="50%">

### 📦 Project Archival
Archive inactive projects to declutter your dashboard while preserving all embedded chunks, meeting transcripts, and commit summaries for future reference.

</td>
</tr>
</table>

<br/>

## ✦ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT  (React / Vite)                       │
│                                                                     │
│   Landing ── Auth ── Dashboard ── RepoView ── QnA ── Meetings      │
│                           │            │        │         │         │
│                      Sidebar     CanvasView  ChatPanel  Insights    │
└────────────────────────────┬────────────────────────────────────────┘
                             │  REST API (JSON)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVER  (Node.js / Express 5)                  │
│                                                                     │
│   Controllers ─── Services ─── Models ─── Middleware                │
│       │               │           │            │                    │
│   auth.ctrl      embedding    User          JWT Auth                │
│   repo.ctrl      chunking    Repo          Multer                   │
│   chat.ctrl      similarity  Chunk                                  │
│   commit.ctrl    git ops     Commit                                 │
│   meeting.ctrl   transcribe  Chat                                   │
│   invitation.ctrl                                                   │
└───────┬──────────────┬──────────────┬──────────────┬────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
   ┌─────────┐  ┌────────────┐  ┌──────────┐  ┌────────────┐
   │ MongoDB │  │   Vector   │  │  Gemini  │  │ AssemblyAI │
   │  Atlas  │  │   Search   │  │   API    │  │    API     │
   │         │  │  (cosine)  │  │  (RAG)   │  │  (STT)     │
   └─────────┘  └────────────┘  └──────────┘  └────────────┘
```

<br/>

## ✦ RAG Pipeline — How It Works

```
  ┌──────────┐     ┌───────────────┐     ┌──────────────┐     ┌─────────────┐
  │  GitHub  │────▶│  AST-Aware    │────▶│  Embedding   │────▶│  MongoDB    │
  │  Clone   │     │  Chunking     │     │  Generation  │     │  Vector     │
  │          │     │  (by file +   │     │  (768-dim)   │     │  Index      │
  │          │     │   structure)  │     │              │     │             │
  └──────────┘     └───────────────┘     └──────────────┘     └──────┬──────┘
                                                                     │
  ┌──────────┐     ┌───────────────┐     ┌──────────────┐            │
  │ Grounded │◀────│  Context      │◀────│   Cosine     │◀───────────┘
  │ Answer   │     │  Assembly +   │     │  Similarity  │
  │ (Gemini) │     │  System Prompt│     │  Retrieval   │
  └──────────┘     └───────────────┘     └──────────────┘
```

| Step | Description |
|------|-------------|
| **1. Clone & Parse** | Repository is fetched via GitHub API. Files are walked, filtered, and read into memory. |
| **2. Chunk** | Source code is split into logical, AST-aware blocks preserving file paths and line ranges. |
| **3. Embed** | Each chunk is embedded into a 768-dimensional dense vector using Google's embedding model. |
| **4. Index** | Vectors are stored in MongoDB Atlas with a cosine similarity index for fast retrieval. |
| **5. Retrieve** | User queries are embedded and matched against stored chunks using vector similarity search. |
| **6. Generate** | Top-K relevant chunks are injected into a deterministic system prompt sent to Gemini for generation. |

<br/>

## ✦ Technology Stack

### Frontend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 19 | Component architecture & UI rendering |
| Build | Vite 8 | Lightning-fast HMR & bundling |
| Styling | Tailwind CSS 4 | Utility-first responsive design system |
| Routing | React Router 7 | Client-side navigation & protected routes |
| State | Zustand 5 | Lightweight global state management |
| Visualization | React Flow (XYFlow) | Interactive node-based repository canvas |
| Editor | Monaco Editor | Syntax-highlighted code viewer |
| UI Primitives | Radix UI | Accessible dialog, dropdown, tooltip, tabs |
| Icons | Lucide React | Consistent iconography |
| HTTP | Axios | API communication layer |
| Notifications | React Hot Toast | Non-blocking toast notifications |

### Backend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js (ES Modules) | Server-side JavaScript execution |
| Framework | Express 5 | HTTP routing & middleware pipeline |
| Database | MongoDB Atlas + Mongoose 9 | Document storage & ODM |
| Vector Search | MongoDB Atlas Vector Index | Cosine similarity search on embeddings |
| AI / LLM | Google Gemini API | RAG inference & commit summarization |
| Embeddings | Google Generative AI SDK | 768-dim vector generation |
| Code Splitting | LangChain Text Splitters | AST-aware source code chunking |
| Audio STT | AssemblyAI SDK | Speech-to-text, diarization, chaptering |
| GitHub | Octokit REST | Repository cloning, commits, diffs |
| Auth | JWT + bcryptjs | Token-based authentication & hashing |
| Uploads | Multer | Multipart file upload handling |
| Realtime | Socket.IO | WebSocket event layer |

<br/>

## ✦ Project Structure

```
repomind/
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.jsx        # Marketing landing with animated hero
│       │   ├── LoginPage.jsx          # Authentication — sign in
│       │   ├── RegisterPage.jsx       # Authentication — sign up
│       │   ├── Dashboard.jsx          # Repository dashboard & project cards
│       │   ├── RepoView.jsx           # Canvas + Chat split workspace
│       │   ├── QnaPage.jsx            # Standalone Q&A interface
│       │   ├── CommitPage.jsx         # Git commit history & diff viewer
│       │   └── MeetingPage.jsx        # Meeting upload & transcript viewer
│       ├── components/
│       │   ├── AppSidebar.jsx         # Collapsible navigation sidebar
│       │   ├── CanvasView.jsx         # React Flow node graph renderer
│       │   ├── ChatPanel.jsx          # RAG chat interface with streaming
│       │   ├── ProjectInsights.jsx    # Commits, meetings, team, archive tabs
│       │   └── ui/                    # Radix-based reusable UI primitives
│       └── lib/
│           └── api.js                 # Axios instance with interceptors
│
├── backend/
│   └── src/
│       ├── controllers/
│       │   ├── auth.controller.js     # Register, login, logout, refresh
│       │   ├── repo.controller.js     # Link, parse, embed, file tree
│       │   ├── chat.controller.js     # RAG query execution pipeline
│       │   ├── commit.controller.js   # Git log, diff fetch, AI summary
│       │   ├── meeting.controller.js  # Audio upload, AssemblyAI processing
│       │   └── invitation.controller.js # Team invitation workflows
│       ├── models/
│       │   ├── user.models.js         # User schema + password hashing
│       │   ├── repo.models.js         # Repository metadata & settings
│       │   ├── chunk.models.js        # Embedded code chunks + vectors
│       │   ├── commit.models.js       # Cached commit data & summaries
│       │   └── chat.models.js         # Chat history & Q&A sessions
│       ├── services/                  # Business logic layer
│       ├── middlewares/               # JWT auth, validation, error handling
│       ├── routes/                    # Express route definitions
│       ├── utils/                     # Helper functions & shared utilities
│       └── db/                        # MongoDB connection setup
│
└── README.md
```

<br/>

## ✦ Getting Started

### Prerequisites

| Requirement | Version |
|------------|---------|
| Node.js | v18.x or higher |
| npm | v9.x or higher |
| MongoDB Atlas | With Vector Search enabled |
| Google Gemini API Key | For RAG inference |
| AssemblyAI API Key | For meeting transcription |

### 1 — Clone the repository

```bash
git clone https://github.com/awaishh/repomind.git
cd repomind
```

### 2 — Configure environment variables

Create a `.env` file inside the `backend/` directory:

```env
# ─── Server ───────────────────────────────────────
PORT=8000
CORS_ORIGIN=http://localhost:5173

# ─── Database ─────────────────────────────────────
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/repomind

# ─── Authentication ───────────────────────────────
ACCESS_TOKEN_SECRET=<your-access-token-secret>
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=<your-refresh-token-secret>
REFRESH_TOKEN_EXPIRY=7d
JWT_SECRET=<your-jwt-secret>
TOKEN_ENCRYPTION_KEY=<your-encryption-key>

# ─── AI & Speech APIs ────────────────────────────
GEMINI_API_KEY=<your-gemini-api-key>
ASSEMBLYAI_API_KEY=<your-assemblyai-api-key>
```

### 3 — Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 4 — Start the development servers

```bash
# Terminal 1 — Backend (http://localhost:8000)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend && npm run dev
```

<br/>

## ✦ Vector Search Index Setup

To enable RAG Q&A, create the following index on your `chunks` collection in MongoDB Atlas:

**Index name:** `vector_index`  
**Type:** Atlas Vector Search

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "repo"
    },
    {
      "type": "filter",
      "path": "filePath"
    }
  ]
}
```

<br/>

## ✦ API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/users/register` | Create a new user account |
| `POST` | `/api/v1/users/login` | Authenticate and receive tokens |
| `POST` | `/api/v1/users/logout` | Invalidate the current session |

### Repository Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/repos` | List all linked repositories |
| `POST` | `/api/v1/repos/link` | Link a new repository via GitHub URL |
| `GET` | `/api/v1/repos/:id` | Get repository metadata & file tree |
| `PATCH` | `/api/v1/repos/:id/archive` | Archive / unarchive a project |

### RAG Q&A

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/qa/ask` | Execute a contextual natural language query |

### Git Commit Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/repos/:id/commits` | Fetch commit log from GitHub |
| `GET` | `/api/v1/repos/:id/commits/:sha/diff` | Get file-level diff for a commit |
| `GET` | `/api/v1/repos/:id/commits/:sha/summary` | AI-generated commit summary |

### Meeting Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/meetings/:repoId` | Upload audio for transcription |
| `GET` | `/api/v1/meetings/:repoId` | Retrieve all meeting summaries |

### Team & Invitations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/invitations` | Send a workspace invitation |
| `GET` | `/api/v1/repos/:id/members` | List team members for a repo |

<br/>

## ✦ Scripts

| Command | Directory | Description |
|---------|-----------|-------------|
| `npm run dev` | `frontend/` | Start Vite dev server with HMR |
| `npm run build` | `frontend/` | Production build |
| `npm run dev` | `backend/` | Start Express with `--watch` mode |
| `npm start` | `backend/` | Production server |
| `npm run reset-db` | `backend/` | Wipe all database collections |

<br/>

## ✦ License

This project is licensed under the **MIT License** — free for personal and commercial use.

<br/>

<div align="center">

---

<br/>

<sub>Built with precision by <strong>Awaish</strong></sub>

<br/><br/>

</div>