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
    status: {
      type: String,
      enum: ["cloning", "parsing", "embedding", "ready", "error"],
      default: "cloning",
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
  },
  { timestamps: true }
);

repoSchema.index({ user: 1, githubUrl: 1 });

const Repo = mongoose.model("Repo", repoSchema);
export default Repo;
