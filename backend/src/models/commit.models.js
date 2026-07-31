import mongoose from "mongoose";

const commitItemSchema = new mongoose.Schema(
    {
        sha: { type: String, required: true },
        message: { type: String, default: "" },
        summary: { type: String, default: "" },
        diff: { type: String, default: "" },
        authorName: { type: String, default: "" },
        authorLogin: { type: String, default: "" },
        authorAvatar: { type: String, default: "" },
        committedAt: { type: Date },
    },
    { _id: false }
);

const commitLogSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        githubUrl: { type: String, required: true },
        owner: { type: String, required: true },
        name: { type: String, required: true },
        commits: { type: [commitItemSchema], default: [] },
        syncedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

commitLogSchema.index({ user: 1, githubUrl: 1 }, { unique: true });

const CommitLog = mongoose.model("CommitLog", commitLogSchema);
export default CommitLog;
