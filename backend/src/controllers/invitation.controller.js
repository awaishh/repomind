import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import Repo from "../models/repo.models.js";

export const sendInvitation = asyncHandler(async (req, res) => {
  const { repoId, email } = req.body;
  if (!repoId || !email) throw new ApiError(400, "RepoId and email required");

  const repo = await Repo.findOne({ _id: repoId, user: req.user._id });
  if (!repo) throw new ApiError(404, "Repo not found");
  if (!repo.collaborators.some((member) => member.email === email.toLowerCase())) {
    repo.collaborators.push({ email: email.toLowerCase(), role: "viewer" });
    await repo.save();
  }
  return res.status(200).json(new ApiResponse(200, {}, "Invitation sent successfully"));
});
