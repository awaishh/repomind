import { Router } from "express";
import { uploadMeeting, getMeetings, getAllMeetings } from "../controllers/meeting.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import multer from "multer";

const upload = multer({ dest: "uploads/" });
const router = Router();

router.use(verifyJWT);
router.get("/", getAllMeetings);
router.post("/", upload.single("recording"), uploadMeeting);
router.get("/:repoId", getMeetings);
router.post("/:repoId", upload.single("recording"), uploadMeeting);

export default router;
