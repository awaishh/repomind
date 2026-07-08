import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sources: [
      {
        filePath: String,
        startLine: Number,
        endLine: Number,
      },
    ],
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    repo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repo",
      required: true,
    },
    title: {
      type: String,
      default: "New Chat",
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);

chatSchema.index({ user: 1, repo: 1 });

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
