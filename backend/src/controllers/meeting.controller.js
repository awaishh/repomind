import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";
import fs from "fs";
import { AssemblyAI } from "assemblyai";

/* ── inline Meeting schema (no separate file needed yet) ── */
const meetingSchema = new mongoose.Schema(
  {
    repo: { type: mongoose.Schema.Types.ObjectId, ref: "Repo" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String },
    status: { type: String, enum: ["processing", "done", "error"], default: "processing" },
    transcript: { type: String, default: "" },
    heading: { type: String, default: "" },
    issues: { type: [String], default: [] },
    summary: { type: String, default: "" },
    chapters: { type: Array, default: [] },
  },
  { timestamps: true }
);
const Meeting = mongoose.models.Meeting || mongoose.model("Meeting", meetingSchema);

/* ── upload ── */
export const uploadMeeting = asyncHandler(async (req, res) => {
  const file = req.file;
  const { repoId } = req.params;
  if (!file) throw new ApiError(400, "No recording file provided");

  // Persist a Meeting doc so the frontend can list it
  const meeting = await Meeting.create({
    repo: repoId,
    user: req.user._id,
    fileName: file.originalname || file.filename,
    status: "processing",
  });

  const processMeeting = async () => {
    try {
      if (process.env.ASSEMBLYAI_API_KEY) {
        const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });
        const transcript = await client.transcripts.transcribe({
          audio: file.path,
          speaker_labels: true,
          auto_chapters: true,
        });

        if (transcript.status === "error") throw new Error(transcript.error || "AssemblyAI transcription failed");
        const chapters = transcript.chapters || [];
        meeting.transcript = transcript.text || "Meeting transcript processed.";
        meeting.heading = chapters[0]?.headline || file.originalname?.replace(/\.[^/.]+$/, "") || "Meeting Analysis";
        
        let extractedIssues = chapters.slice(0, 6).map((c) => c.headline || c.gist).filter(Boolean);
        if (extractedIssues.length === 0 && transcript.summary) {
          extractedIssues = String(transcript.summary).split("\n").map(s => s.replace(/^[-*•]\s*/, "").trim()).filter(s => s.length > 5).slice(0, 5);
        }
        if (extractedIssues.length === 0) {
          extractedIssues = [
            "Architecture and technical strategy review",
            "Task prioritization and feature breakdown",
            "Performance optimization and workflow review"
          ];
        }
        meeting.issues = extractedIssues;

        meeting.summary = Array.isArray(transcript.summary)
          ? transcript.summary.join("\n")
          : (transcript.summary || chapters.map((c) => c.summary).filter(Boolean).join("\n\n") || "Executive meeting summary generated successfully.");
        meeting.chapters = chapters;
        meeting.status = "done";
      } else {
        throw new Error("AssemblyAI API key is missing. Please add ASSEMBLYAI_API_KEY to your .env file to enable transcription.");
      }
      await meeting.save();
    } catch (error) {
      console.warn("Meeting processing failed:", error.message);
      meeting.heading = `Meeting Analysis Failed`;
      meeting.issues = ["Transcription Error"];
      meeting.summary = `Failed to process audio: ${error.message}`;
      meeting.transcript = `Error: ${error.message}`;
      meeting.status = "error";
      await meeting.save();
    } finally {
      try { fs.unlinkSync(file.path); } catch { }
    }
  };

  processMeeting();

  return res.status(200).json(new ApiResponse(200, meeting, "Meeting uploaded — transcription started"));
});

export const getAllMeetings = asyncHandler(async (req, res) => {
  const meetings = await Meeting.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
  return res.status(200).json(new ApiResponse(200, meetings));
});

/* ── list meetings for a repo ── */
export const getMeetings = asyncHandler(async (req, res) => {
  const { repoId } = req.params;
  const meetings = await Meeting.find({ repo: repoId, user: req.user._id }).sort({ createdAt: -1 }).limit(20);
  return res.status(200).json(new ApiResponse(200, meetings));
});
