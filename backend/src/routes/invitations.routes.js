import { Router } from "express";
import { sendInvitation } from "../controllers/invitation.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.post("/", sendInvitation);

export default router;
