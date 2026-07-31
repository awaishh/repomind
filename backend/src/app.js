import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
import authRoutes from "./routes/auth.routes.js";
import repoRoutes from "./routes/repo.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import meetingRoutes from "./routes/meeting.routes.js";
import invitationRoutes from "./routes/invitations.routes.js";
import commitRoutes from "./routes/commit.routes.js";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/repo", repoRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/meeting", meetingRoutes);
app.use("/api/v1/invitations", invitationRoutes);
app.use("/api/v1/commits", commitRoutes);

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  });
});

export { app };
