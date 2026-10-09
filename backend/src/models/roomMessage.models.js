import mongoose from "mongoose";

const roomMessageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [4000, "Message cannot exceed 4000 characters"],
    },
    messageType: {
      type: String,
      enum: ["text", "code", "system"],
      default: "text",
    },
    codeLanguage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

roomMessageSchema.index({ room: 1, createdAt: 1 });

const RoomMessage =
  mongoose.models.RoomMessage || mongoose.model("RoomMessage", roomMessageSchema);
export default RoomMessage;
