import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/user.models.js";
import Room from "./models/room.models.js";
import RoomMessage from "./models/roomMessage.models.js";

let io = null;

/**
 * Parse cookies from raw cookie header string
 */
function parseCookie(cookieString) {
  if (!cookieString) return {};
  return cookieString
    .split(";")
    .reduce((res, c) => {
      const [key, val] = c.trim().split("=");
      try {
        res[key] = decodeURIComponent(val);
      } catch {
        res[key] = val;
      }
      return res;
    }, {});
}

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT Authentication Middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const cookies = parseCookie(socket.handshake.headers?.cookie);
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        cookies.accessToken ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication error: Token not provided"));
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded?._id).select(
        "-password -refreshToken"
      );

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    // Join a specific room channel
    socket.on("join_room", async ({ roomId }) => {
      try {
        if (!roomId) return;

        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit("error_message", { message: "Room not found" });
          return;
        }

        const isMember = room.members.some((m) =>
          m.user.equals(socket.user._id)
        );
        if (!isMember) {
          socket.emit("error_message", {
            message: "You are not a member of this room",
          });
          return;
        }

        socket.join(roomId);
        socket.emit("room_joined", { roomId });

        // Notify other room members
        socket.to(roomId).emit("user_joined", {
          roomId,
          user: {
            _id: socket.user._id,
            username: socket.user.username,
            avatar: socket.user.avatar,
          },
        });
      } catch (err) {
        console.error("Socket join_room error:", err.message);
      }
    });

    // Leave a specific room channel
    socket.on("leave_room", ({ roomId }) => {
      if (!roomId) return;
      socket.leave(roomId);
      socket.to(roomId).emit("user_left", {
        roomId,
        user: {
          _id: socket.user._id,
          username: socket.user.username,
        },
      });
    });

    // Send a message within a room
    socket.on("send_message", async ({ roomId, content, messageType = "text", codeLanguage = "" }) => {
      try {
        if (!roomId || !content || !content.trim()) {
          socket.emit("error_message", {
            message: "Room ID and message content are required",
          });
          return;
        }

        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit("error_message", { message: "Room not found" });
          return;
        }

        const isMember = room.members.some((m) =>
          m.user.equals(socket.user._id)
        );
        if (!isMember) {
          socket.emit("error_message", {
            message: "You are not authorized to post in this room",
          });
          return;
        }

        const message = await RoomMessage.create({
          room: roomId,
          sender: socket.user._id,
          content: content.trim(),
          messageType: ["text", "code", "system"].includes(messageType)
            ? messageType
            : "text",
          codeLanguage: codeLanguage || "",
        });

        await message.populate("sender", "username avatar email fullName organization");

        room.lastMessage = message._id;
        await room.save();

        // Broadcast new message to all clients in the room (including sender)
        io.to(roomId).emit("new_message", message);
      } catch (err) {
        console.error("Socket send_message error:", err.message);
        socket.emit("error_message", {
          message: "Failed to send message: " + err.message,
        });
      }
    });

    // Real-time typing indicators
    socket.on("typing_start", ({ roomId }) => {
      if (!roomId) return;
      socket.to(roomId).emit("user_typing", {
        roomId,
        user: {
          _id: socket.user._id,
          username: socket.user.username,
        },
      });
    });

    socket.on("typing_stop", ({ roomId }) => {
      if (!roomId) return;
      socket.to(roomId).emit("user_stopped_typing", {
        roomId,
        userId: socket.user._id,
      });
    });

    socket.on("disconnect", () => {
      // Socket disconnected cleanly
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io has not been initialized yet!");
  }
  return io;
}
