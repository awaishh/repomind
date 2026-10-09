import { Router } from "express";
import {
  createRoom,
  getUserRooms,
  getRoomDetails,
  getRoomByCode,
  joinRoom,
  getRoomMessages,
  leaveRoom,
} from "../controllers/room.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All room routes require authentication
router.use(verifyJWT);

router.route("/").get(getUserRooms).post(createRoom);
router.route("/join").post(joinRoom);
router.route("/code/:code").get(getRoomByCode);
router.route("/:roomId").get(getRoomDetails);
router.route("/:roomId/messages").get(getRoomMessages);
router.route("/:roomId/leave").post(leaveRoom);

export default router;
