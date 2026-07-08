import { Router } from "express";
import {
  sendMessage,
  getChats,
  getChat,
  deleteChat,
} from "../controllers/chat.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/message", sendMessage);
router.get("/repo/:repoId", getChats);
router.get("/:chatId", getChat);
router.delete("/:chatId", deleteChat);

export default router;
