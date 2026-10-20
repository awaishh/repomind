# RepoMind

An AI-powered codebase intelligence platform built on the MERN stack. Link your GitHub repositories, inspect commits and code diffs, ask questions grounded directly in your codebase via local RAG, collaborate in real-time Dev Rooms, and manage your developer profile.

---

## What is RepoMind?

RepoMind is designed for developers who want to understand unfamiliar codebases faster. Instead of manually digging through hundreds of files or waiting for teammates to explain a repository, RepoMind gives you:

1. **Repository Q&A (RAG Pipeline)**: Ask questions in plain English and get answers with exact file context, powered by local embeddings and local LLMs (or optional cloud models).
2. **Commit Analyzer Pipeline**: Connect to GitHub to inspect commit logs, view file-by-file diffs, and generate summaries of code changes.
3. **Dev Rooms**: Real-time team chat rooms powered by Socket.IO with quick QR code joining, code snippet sharing, and instant member navigation.
4. **Developer Profiles**: Custom profile pictures, organizational affiliation, personal bios, and a direct directory of all joined chat rooms.
5. **Visual Repository Canvas**: An interactive, zoomable node graph powered by React Flow that makes directory structures visual and intuitive.

---

## Core Features

### 1. Codebase Q&A (Local RAG)
- **Semantic Code Chunking**: Source files are parsed and split into logical blocks preserving file paths and line ranges using LangChain text splitters.
- **Vector Search**: Chunks are embedded into 768-dimensional vectors using `nomic-embed-text` and indexed in MongoDB Atlas Vector Search.
- **Local Inference**: Queries are answered using local models like `qwen2.5-coder` via Ollama (`http://localhost:11434`) — giving you unlimited queries with zero API costs and zero rate limits.
- **Grounded Responses**: Answers reference relevant files so you can verify the code directly.

### 2. Commit Analyzer
- Connects directly to GitHub via Octokit REST API.
- Fetches recent commit histories and parses file-level diffs inline.
- Generates concise change summaries explaining what changed and which modules were affected.

### 3. Dev Rooms (Real-time Team Chat)
- Create or join topic-specific chat rooms.
- **Instant QR Code Invites**: Invite teammates via scan or shareable room code.
- **Live Collaboration**: Powered by Socket.IO with typing indicators, active participant lists, and formatted code message mode.
- **Member Directory**: View room members with role badges (Creator, Admin, Member).

### 4. Profiles & In-Chat Profile Viewer
- Upload profile photos with instant avatar updates across the app.
- Edit your full name, username, current organization, and developer bio.
- **In-Chat Profile Card**: Click on any sender's avatar or `@username` in Dev Rooms to view their organization, bio, and joined rooms.
- **My Chat Groups**: See all your joined rooms in one place with direct one-click navigation.

### 5. Interactive Repository Canvas
- Visual node graph powered by React Flow (XYFlow).
- Pan, zoom, and inspect directories and files visually without relying solely on the terminal.

---

## Technology Stack

### Frontend
- **Framework**: React 19 (SPA)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4 + custom styling utilities
- **State Management**: Zustand 5
- **Routing**: React Router 7
- **Interactive Graph**: React Flow (XYFlow)
- **Real-Time Client**: Socket.IO Client
- **Icons & UI**: Lucide React, React Hot Toast

### Backend
- **Runtime**: Node.js (ES Modules) + Express 5
- **Database & ODM**: MongoDB Atlas + Mongoose 9
- **Vector Search**: MongoDB Atlas Vector Search (Cosine Similarity)
- **Local AI / LLM**: Ollama (`qwen2.5-coder` / `qwen2.5` + `nomic-embed-text`)
- **Cloud AI (Optional)**: Google Gemini API
- **Real-Time Engine**: Socket.IO
- **GitHub Integration**: Octokit REST
- **File Uploads**: Multer + Cloudinary (with local fallback)
- **Authentication**: JWT (Access & Refresh tokens) + bcryptjs

---

## Project Structure

```
repomind/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx     # Product landing & hero
│   │   │   ├── LoginPage.jsx       # User login
│   │   │   ├── RegisterPage.jsx    # User signup
│   │   │   ├── Dashboard.jsx       # Repository dashboard & link repo modal
│   │   │   ├── RepoView.jsx        # Visual canvas & split chat workspace
│   │   │   ├── QnaPage.jsx         # Standalone codebase Q&A interface
│   │   │   ├── CommitPage.jsx      # Commit history & diff analyzer
│   │   │   ├── MeetingPage.jsx     # Meeting notes & summaries
│   │   │   ├── RoomsPage.jsx       # Dev Rooms real-time chat & timeline
│   │   │   ├── JoinRoomPage.jsx    # QR scan & direct room join
│   │   │   └── ProfilePage.jsx     # User profile, photo upload & groups
│   │   ├── components/
│   │   │   ├── AppSidebar.jsx      # Collapsible application sidebar
│   │   │   └── rooms/
│   │   │       ├── UserAvatar.jsx        # Color-coded initials & photo avatar
│   │   │       ├── UserProfileModal.jsx  # In-chat profile viewer modal
│   │   │       ├── RoomInfoModal.jsx     # Room details & member navigation
│   │   │       ├── QRCodeModal.jsx       # Shareable QR invitation modal
│   │   │       ├── CreateRoomModal.jsx   # Create room modal
│   │   │       └── JoinRoomModal.jsx     # Join room modal
│   │   └── store/                  # Zustand stores (auth, repos, rooms)
│
├── backend/
│   ├── src/
│   │   ├── controllers/            # Auth, repo, chat, commit, room handlers
│   │   ├── models/                 # User, Repo, Room, Chunk, Message schemas
│   │   ├── routes/                 # Express API routes
│   │   ├── services/
│   │   │   ├── ollama.service.js   # Local Ollama LLM & embedding operations
│   │   │   └── rag.service.js      # Chunking, indexing, and context assembly
│   │   ├── socket.js               # Socket.IO room & messaging event handlers
│   │   └── db/                     # MongoDB connection
│   └── uploads/                    # Local temporary storage
│
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: A local MongoDB instance or MongoDB Atlas cluster (with a Vector Search index for RAG)
- **Ollama** (recommended for local AI): [Install Ollama](https://ollama.ai)

If using Ollama, pull the recommended models:
```bash
ollama pull qwen2.5-coder
ollama pull nomic-embed-text
```

---

### Installation & Setup

#### 1. Clone the repository
```bash
git clone https://github.com/awaishh/repomind.git
cd repomind
```

#### 2. Backend Setup
Navigate into the `backend` directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (you can copy `.env.example`):
```env
PORT=8000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/repomind?retryWrites=true&w=majority
CORS_ORIGIN=http://localhost:5173

# Authentication
ACCESS_TOKEN_SECRET=your_access_token_secret_key
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key
REFRESH_TOKEN_EXPIRY=7d
TOKEN_ENCRYPTION_KEY=your_token_encryption_key

# Local Ollama (Optional custom host/models)
OLLAMA_HOST=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen2.5-coder
OLLAMA_EMBED_MODEL=nomic-embed-text

# Cloud AI (Optional fallback)
GEMINI_API_KEY=your_gemini_api_key

# Cloudinary (Optional for avatar cloud storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Start the backend development server:
```bash
npm run dev
```
The backend will run on `http://localhost:8000`.

#### 3. Frontend Setup
In a new terminal, navigate into the `frontend` directory and install dependencies:
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`.

---

## Vector Search Index (MongoDB Atlas)

To enable vector similarity search on code chunks in MongoDB Atlas:
1. Open your cluster in MongoDB Atlas and go to **Atlas Search** / **Vector Search**.
2. Create a Search Index on the `chunks` collection:
   - **Index Name**: `vector_index`
   - **Configuration**:
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

## Key Scripts

| Command | Location | Description |
| :--- | :--- | :--- |
| `npm run dev` | `backend/` | Starts backend server with nodemon |
| `npm start` | `backend/` | Runs backend in production mode |
| `npm run dev` | `frontend/` | Starts Vite development server with HMR |
| `npm run build` | `frontend/` | Builds optimized production bundle |
| `npm run lint` | `frontend/` | Runs ESLint checks |

---

## License

This project is licensed under the [MIT License](LICENSE).