import { io } from "socket.io-client";

let socket = null;

/**
 * Initialize or retrieve the authenticated Socket.IO client instance
 */
export function getSocket() {
  const token = localStorage.getItem("accessToken");

  if (!socket) {
    socket = io("/", {
      autoConnect: false,
      withCredentials: true,
      auth: {
        token: token || "",
      },
      transports: ["websocket", "polling"],
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
    });
  } else if (token && socket.auth?.token !== token) {
    // Update auth token if it changed
    socket.auth = { token };
  }

  return socket;
}

/**
 * Connect the socket if disconnected
 */
export function connectSocket() {
  const s = getSocket();
  const token = localStorage.getItem("accessToken");
  if (s.auth) {
    s.auth.token = token || "";
  }
  if (!s.connected) {
    s.connect();
  }
  return s;
}

/**
 * Disconnect socket cleanly
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Join a room channel
 */
export function joinRoomSocket(roomId) {
  const s = connectSocket();
  s.emit("join_room", { roomId });
}

/**
 * Leave a room channel
 */
export function leaveRoomSocket(roomId) {
  if (socket && socket.connected) {
    socket.emit("leave_room", { roomId });
  }
}

/**
 * Send real-time message to room
 */
export function sendRoomMessageSocket({ roomId, content, messageType = "text", codeLanguage = "" }) {
  const s = connectSocket();
  s.emit("send_message", {
    roomId,
    content,
    messageType,
    codeLanguage,
  });
}

/**
 * Notify typing start
 */
export function emitTypingStart(roomId) {
  const s = connectSocket();
  s.emit("typing_start", { roomId });
}

/**
 * Notify typing stop
 */
export function emitTypingStop(roomId) {
  const s = connectSocket();
  s.emit("typing_stop", { roomId });
}
