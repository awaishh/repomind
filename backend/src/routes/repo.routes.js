import { Router } from "express";
import {
  cloneAndProcess,
  getRepoStatus,
  getUserRepos,
  getRepo,
  deleteRepo,
  getRepoFile,
  getRepoCommits,
  getCommitDiff,
  summarizeCommitDiff,
  getRepoMembers,
  archiveRepo,
} from "../controllers/repo.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // All repo routes require auth

router.post("/clone", cloneAndProcess);
router.get("/", getUserRepos);
router.get("/:repoId/file", getRepoFile);
router.get("/:repoId/status", getRepoStatus);
router.get("/:repoId/commits", getRepoCommits);
router.get("/:repoId/commits/:sha/diff", getCommitDiff);
router.get("/:repoId/commits/:sha/summary", summarizeCommitDiff);
router.patch("/:repoId/archive", archiveRepo);
router.get("/:repoId/members", getRepoMembers);
router.get("/:repoId", getRepo);
router.delete("/:repoId", deleteRepo);

export default router;
