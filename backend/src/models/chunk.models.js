import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema(
  {
    repo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repo",
      required: true,
      index: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    startLine: {
      type: Number,
      default: 0,
    },
    endLine: {
      type: Number,
      default: 0,
    },
    chunkIndex: {
      type: Number,
      default: 0,
    },
    embedding: {
      type: [Number], // Supports 768-dim (nomic-embed-text) or 3072-dim (gemini-embedding-001)
      default: [],
    },
  },
  { timestamps: true }
);

// Index for vector search will be created on Atlas side
chunkSchema.index({ repo: 1, filePath: 1 });

const Chunk = mongoose.model("Chunk", chunkSchema);
export default Chunk;
