import Chat from "../models/chat.models.js";
import Repo from "../models/repo.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { searchChunks, isAuthQuery } from "../services/retrieval.service.js";
import { askGemini } from "../services/gemini.service.js";
import { indexRepository } from "../services/indexing.service.js";

/**
 * Send a message in a chat — performs RAG retrieval then generates a response.
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { repoId, message, scopedFiles = [], chatId } = req.body;
  const userId = req.user._id;

  if (!repoId || !message) {
    throw new ApiError(400, "repoId and message are required");
  }
  if (message.length > 800) {
    throw new ApiError(400, "Please keep your question under 800 characters.");
  }

  // Verify repo exists and belongs to user
  const repo = await Repo.findOne({ _id: repoId, user: userId });
  if (!repo) {
    throw new ApiError(404, "Repo not found");
  }

  // Ensure repo is marked ready and indexed seamlessly
  if (repo.status !== "ready" && repo.status !== "archived") {
    repo.status = "ready";
    await repo.save();
  }

  if (repo.ragStatus !== "ready") {
    try {
      await indexRepository(repo);
    } catch (err) {
      console.warn("RAG indexing auto-fallback for Q&A:", err.message);
      repo.ragStatus = "ready";
      await repo.save();
    }
  }

  // Find or create chat
  let chat;
  if (chatId) {
    chat = await Chat.findOne({ _id: chatId, user: userId, repo: repoId });
    if (!chat) {
      throw new ApiError(404, "Chat not found");
    }
  } else {
    // Create new chat
    chat = await Chat.create({
      user: userId,
      repo: repoId,
      title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
      messages: [],
    });
  }

  // Check if query is auth-related for biased retrieval
  const biasAuth = isAuthQuery(message);

  // Perform RAG retrieval
  const retrievedChunks = await searchChunks(repoId, message, {
    scopedFiles,
    topK: 5,
    biasAuth,
  });

  // Get recent conversation history (last 6 messages)
  const recentHistory = chat.messages.slice(-4);

  // Generate AI response
  const aiResponse = await askGemini(message, retrievedChunks, recentHistory);

  // Extract source references
  const sources = retrievedChunks.slice(0, 4).map((c) => ({
    filePath: c.filePath,
    startLine: c.startLine,
    endLine: c.endLine,
  }));

  // Save user message
  chat.messages.push({
    role: "user",
    content: message,
    sources: [],
  });

  // Save assistant response
  chat.messages.push({
    role: "assistant",
    content: aiResponse,
    sources,
  });

  await chat.save();

  return res.status(200).json(
    new ApiResponse(200, {
      chatId: chat._id,
      response: aiResponse,
      sources,
    })
  );
});

/**
 * Get all chats for a repo.
 */
export const getChats = asyncHandler(async (req, res) => {
  const { repoId } = req.params;
  const userId = req.user._id;

  const chats = await Chat.find({ user: userId, repo: repoId })
    .select("title createdAt updatedAt")
    .sort({ updatedAt: -1 });

  return res.status(200).json(new ApiResponse(200, chats));
});

/**
 * Get a single chat with all messages.
 */
export const getChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findOne({ _id: chatId, user: userId });
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  return res.status(200).json(new ApiResponse(200, chat));
});

/**
 * Delete a chat.
 */
export const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findOneAndDelete({ _id: chatId, user: userId });
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Chat deleted successfully"));
});
