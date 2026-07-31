import mongoose from "mongoose";
import dotenv from "dotenv";
import Repo from "./models/repo.models.js";
import Chunk from "./models/chunk.models.js";
import Chat from "./models/chat.models.js";
import CommitLog from "./models/commit.models.js";

dotenv.config();

async function clearDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/repomind");
    
    console.log("Clearing duplicate repositories, vector chunks, chats, and commit logs...");
    await Repo.deleteMany({});
    await Chunk.deleteMany({});
    await Chat.deleteMany({});
    await CommitLog.deleteMany({});
    
    console.log("✅ Database reset complete! All old test data deleted.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Database reset error:", err.message);
    process.exit(1);
  }
}

clearDatabase();
