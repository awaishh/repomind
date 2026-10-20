import { Router } from "express";
import {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  updateAvatar,
  getUserProfile,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyJWT, logout);
router.get("/me", verifyJWT, getCurrentUser);
router.patch("/profile", verifyJWT, updateProfile);
router.patch("/avatar", verifyJWT, upload.single("avatar"), updateAvatar);
router.get("/user/:userId", verifyJWT, getUserProfile);

export default router;
