import crypto from "crypto";
import mongoose from "mongoose";
import Room from "../models/room.models.js";
import RoomMessage from "../models/roomMessage.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

/**
 * Generate a unique, readable room invite code (e.g. RPM-9A2F4)
 */
async function generateUniqueRoomCode() {
  let isUnique = false;
  let code = "";

  while (!isUnique) {
    const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
    code = `RPM-${randomPart}`;
    const existing = await Room.findOne({ code });
    if (!existing) {
      isUnique = true;
    }
  }

  return code;
}

/**
 * Create a new room
 */
export const createRoom = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim().length < 2) {
    throw new ApiError(400, "Room name must be at least 2 characters long");
  }

  const code = await generateUniqueRoomCode();

  const room = await Room.create({
    name: name.trim(),
    description: description?.trim() || "",
    code,
    creator: req.user._id,
    members: [
      {
        user: req.user._id,
        role: "admin",
        joinedAt: new Date(),
      },
    ],
  });

  // Create welcome system message
  const systemMsg = await RoomMessage.create({
    room: room._id,
    sender: req.user._id,
    content: `Welcome to #${room.name}! Room created by @${req.user.username}. Share the QR code or code ${code} to invite teammates.`,
    messageType: "system",
  });

  room.lastMessage = systemMsg._id;
  await room.save();

  const populatedRoom = await Room.findById(room._id)
    .populate("creator", "username email avatar fullName organization")
    .populate("members.user", "username email avatar fullName organization")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username avatar fullName organization" },
    });

  return res
    .status(201)
    .json(new ApiResponse(201, populatedRoom, "Room created successfully"));
});

/**
 * Get all rooms joined by current user
 */
export const getUserRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ "members.user": req.user._id })
    .populate("creator", "username avatar fullName organization")
    .populate("members.user", "username avatar email fullName organization")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username avatar fullName organization" },
    })
    .sort({ updatedAt: -1 });

  return res.status(200).json(new ApiResponse(200, rooms));
});

/**
 * Get specific room details by ID
 */
export const getRoomDetails = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    throw new ApiError(400, "Invalid room ID");
  }

  const room = await Room.findById(roomId)
    .populate("creator", "username email avatar fullName organization")
    .populate("members.user", "username email avatar fullName organization")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username avatar fullName organization" },
    });

  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  const isMember = room.members.some((m) => m.user._id.equals(req.user._id));
  if (!isMember) {
    throw new ApiError(403, "You must be a member to view this room");
  }

  return res.status(200).json(new ApiResponse(200, room));
});

/**
 * Get room preview by invite code (e.g. from QR code scan)
 */
export const getRoomByCode = asyncHandler(async (req, res) => {
  const code = req.params.code?.trim().toUpperCase();

  if (!code) {
    throw new ApiError(400, "Room invite code is required");
  }

  const room = await Room.findOne({ code })
    .populate("creator", "username avatar")
    .populate("members.user", "username avatar");

  if (!room) {
    throw new ApiError(404, "Invalid room code or room no longer exists");
  }

  const isMember = room.members.some((m) => m.user._id.equals(req.user._id));

  const preview = {
    _id: room._id,
    name: room.name,
    description: room.description,
    code: room.code,
    creator: room.creator,
    memberCount: room.members.length,
    members: room.members.slice(0, 5),
    isMember,
    createdAt: room.createdAt,
  };

  return res.status(200).json(new ApiResponse(200, preview));
});

/**
 * Join a room via room code or roomId
 */
export const joinRoom = asyncHandler(async (req, res) => {
  const { code, roomId } = req.body;

  let query = {};
  if (code) {
    query.code = code.trim().toUpperCase();
  } else if (roomId && mongoose.Types.ObjectId.isValid(roomId)) {
    query._id = roomId;
  } else {
    throw new ApiError(400, "A valid room code or room ID is required");
  }

  const room = await Room.findOne(query);

  if (!room) {
    throw new ApiError(404, "Room not found. Please verify the invite code.");
  }

  const alreadyMember = room.members.some((m) =>
    m.user.equals(req.user._id)
  );

  if (!alreadyMember) {
    room.members.push({
      user: req.user._id,
      role: "member",
      joinedAt: new Date(),
    });

    const systemMsg = await RoomMessage.create({
      room: room._id,
      sender: req.user._id,
      content: `@${req.user.username} joined the room via invite code / QR code.`,
      messageType: "system",
    });

    room.lastMessage = systemMsg._id;
    await room.save();
  }

  const populatedRoom = await Room.findById(room._id)
    .populate("creator", "username email avatar fullName organization")
    .populate("members.user", "username email avatar fullName organization")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username avatar fullName organization" },
    });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        populatedRoom,
        alreadyMember ? "Already a member" : "Joined room successfully"
      )
    );
});

/**
 * Get message history for a room
 */
export const getRoomMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    throw new ApiError(400, "Invalid room ID");
  }

  const room = await Room.findById(roomId);
  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  const isMember = room.members.some((m) => m.user.equals(req.user._id));
  if (!isMember) {
    throw new ApiError(403, "You must be a member to view room messages");
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);

  const messages = await RoomMessage.find({ room: roomId })
    .populate("sender", "username avatar email fullName organization")
    .sort({ createdAt: 1 })
    .limit(limit);

  return res.status(200).json(new ApiResponse(200, messages));
});

/**
 * Leave a room
 */
export const leaveRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    throw new ApiError(400, "Invalid room ID");
  }

  const room = await Room.findById(roomId);
  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  const memberIndex = room.members.findIndex((m) =>
    m.user.equals(req.user._id)
  );

  if (memberIndex === -1) {
    throw new ApiError(400, "You are not a member of this room");
  }

  room.members.splice(memberIndex, 1);

  if (room.members.length === 0) {
    // If no members left, delete room and its messages
    await RoomMessage.deleteMany({ room: room._id });
    await Room.findByIdAndDelete(room._id);
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Room deleted as all members left"));
  }

  // If the leaving user was the creator/admin, pass admin role to another member
  if (room.creator.equals(req.user._id) && room.members.length > 0) {
    room.creator = room.members[0].user;
    room.members[0].role = "admin";
  }

  const systemMsg = await RoomMessage.create({
    room: room._id,
    sender: req.user._id,
    content: `@${req.user.username} left the room.`,
    messageType: "system",
  });

  room.lastMessage = systemMsg._id;
  await room.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Left room successfully"));
});
