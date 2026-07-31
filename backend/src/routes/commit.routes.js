import { Router } from "express";
import {
    syncCommits,
    getSavedCommits,
    deleteSavedCommits,
} from "../controllers/commit.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.post("/sync", syncCommits);
router.get("/", getSavedCommits);
router.delete("/:id", deleteSavedCommits);

export default router;