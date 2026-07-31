import mongoose from "mongoose";

const fileNodeSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["file", "directory"], required: true },
    extension: { type: String, default: "" },
    size: { type: Number, default: 0 },
    children: [{ type: String }], // paths of children for directories
  },
  { _id: false }
);

const repoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    githubUrl: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "",
    },
    stars: {
      type: Number,
      default: 0,
    },
    fileTree: [fileNodeSchema],
    readmeSummary: {
      type: String,
      default: "",
    },
    ragStatus: {
      type: String,
      enum: ["not_started", "processing", "ready", "error"],
      default: "not_started",
    },
    status: {
      type: String,
      enum: ["fetching", "parsing", "processing", "linked", "ready", "error", "archived"],
      default: "fetching",
    },
    errorMessage: {
      type: String,
      default: "",
    },
    totalFiles: {
      type: Number,
      default: 0,
    },
    totalChunks: {
      type: Number,
      default: 0,
    },
    collaborators: [{
      email: { type: String, required: true },
      role: { type: String, default: "viewer" },
      invitedAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

repoSchema.index({ user: 1, githubUrl: 1 });

const Repo = mongoose.model("Repo", repoSchema);
export default Repo;
