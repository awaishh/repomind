import "./env.js";

import http from "http";
import connectDb from "./db/index.js";
import { app } from "./app.js";
import { initSocket } from "./socket.js";

const PORT = process.env.PORT || 8000;
const server = http.createServer(app);

initSocket(server);

connectDb()
  .then(() => {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server with Socket.IO running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });
// server instance entrypoint

