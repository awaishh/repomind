# RepoMind

RepoMind is an enterprise-grade, cloud-native developer intelligence platform designed for repository visualization, high-performance Retrieval-Augmented Generation (RAG) code Q&A, Git commit diff analysis, and asynchronous meeting audio transcription.

The platform employs a decoupled architectural model separating repository metadata management from compute-heavy vector indexing. This architecture guarantees sub-second initial repository linking while deferring RAG vector embedding generation to lazy execution cycles.

---

## Architectural Highlights

### Decoupled Repository Linking and Lazy RAG
Standard code intelligence platforms often execute blocking repository parsing and embedding generation upon initial import, causing severe latency and unnecessary API consumption. RepoMind solves this through a lightweight metadata synchronization layer. Repository structures, branch trees, and metadata are indexed immediately. Full source code chunking and vector embedding generation are deferred until a user initializes a repository Q&A workspace.

### High-Performance RAG Pipeline
RepoMind utilizes a multi-tier Retrieval-Augmented Generation pipeline:
1. AST-Aware Code Chunking: Source files are segmented into logical structural blocks preserving file paths and line ranges.
2. Vector Indexing: Code chunks are embedded into dense vector space using a 768-dimensional embedding model stored within a MongoDB vector search collection.
3. Hybrid Retrieval: User queries execute cosine similarity matching against embedded chunks, supplemented by a secondary structural keyword matching fallback.
4. Contextual Generation: Relevant context snippets are framed within deterministic system prompts to provide precise code answers with source location references.

### Git Diff Intelligence Engine
The Commit Reader workspace fetches repository commit logs and isolates file diffs. It runs automated change analysis to produce concise change summaries, key impact areas, and developer refactoring insights across commit histories.

### Asynchronous Meeting Intelligence
The Meeting Room module processes technical discussions and standup audio recordings using AssemblyAI. It executes speaker diarization, auto-chaptering, and NLP topic segmentation, generating:
- Full audio transcripts with timestamps
- Key technical headings & topic titles
- Action items, identified project blockers & issues
- Executive bulleted summaries

---

## Key Features

- Contextual Code Q&A: Natural language chat interface with vector-driven context retrieval referencing exact code files and line numbers.
- Git Diff Analyzer: Automated commit diff parsing providing commit-level change breakdowns.
- AssemblyAI Meeting Intelligence: Speech-to-text processing for development syncs, producing structured summaries, transcripts, and technical key takeaways.
- Workspace Collaboration: User invitation workflows and shared repository workspace management.
- Modern Responsive Design System: Accessible light-themed user interface focused on technical readability and clean typography.

---

## System Architecture

```
[ Frontend: React / Vite / Custom Design System ]
                       |
                       v (REST API / JSON)
[ Backend: Node.js / Express ]
      |        |        |               |
      v        v        v               v
 [MongoDB]  [Vector] [Local AI / RAG] [AssemblyAI Audio]
 (Storage)  (Search) (Inference Engine) (Transcription)
```

---

## Technology Stack

### Frontend
- Framework: React 18
- Build Tool: Vite
- Styling: Custom CSS Design System
- Icons: Lucide React

### Backend
- Runtime: Node.js (ES Modules)
- Framework: Express.js
- Database: MongoDB with Mongoose ODM
- Vector Search: MongoDB Vector Index / Cosine Similarity Engine
- Audio Speech-to-Text: AssemblyAI API SDK
- File Uploads: Multer

---

## Installation & Setup Guide

### Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)
- MongoDB Instance (Local MongoDB Community Server or MongoDB Atlas cluster)

---

### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/repomind.git
cd repomind
```

---

### Step 2: Configure Environment Variables

Create a `.env` file inside the `backend` directory:

```env
# Server Configuration
PORT=8000
CORS_ORIGIN=http://localhost:5173

# Database Configuration
MONGO_URI=mongodb://localhost:27017/repomind

# Authentication
ACCESS_TOKEN_SECRET=your_access_token_secret_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRY=7d
JWT_SECRET=your_jwt_secret_here
TOKEN_ENCRYPTION_KEY=your_encryption_key_here

# Speech-to-Text API
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here

# Database Reset Command (Optional)
# npm run reset-db
```

---

### Step 3: Install Dependencies

#### Install Backend Dependencies
```bash
cd backend
npm install
```

#### Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

---

### Step 4: Run Application

#### Start Backend Server
```bash
cd backend
npm run dev
```

#### Start Frontend Application
```bash
cd frontend
npm run dev
```

The frontend application will be accessible at `http://localhost:5173` and the API server at `http://localhost:8000`.

---

## Database Indexing & Vector Search Setup

If using MongoDB Atlas Vector Search, apply the following index definition on the `chunks` collection:

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

---

## API Reference

### Authentication Routes
- `POST /api/v1/users/register` - Create user account
- `POST /api/v1/users/login` - Authenticate user session
- `POST /api/v1/users/logout` - Terminate session

### Repository Management
- `GET /api/v1/repos` - List linked repositories
- `POST /api/v1/repos/link` - Link repository via URL or path
- `GET /api/v1/repos/:id` - Fetch repository metadata and file tree

### Q&A & Retrieval
- `POST /api/v1/qa/ask` - Execute contextual natural language query against repository

### Git Commit Analysis
- `GET /api/v1/commits/:repoId` - Fetch commit log and file diffs
- `POST /api/v1/commits/summarize` - Summarize commit diff

### Meeting Analysis
- `POST /api/v1/meetings/upload/:repoId` - Upload audio recording for analysis
- `GET /api/v1/meetings/:repoId` - Retrieve meeting summaries and transcripts

---

## License

This project is licensed under the MIT License.