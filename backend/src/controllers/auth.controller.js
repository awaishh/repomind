import User from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { COOKIE_OPTIONS } from "../constants.js";

const generateTokens = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  const user = await User.create({ username, email, password });

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(201)
    .cookie("accessToken", accessToken, COOKIE_OPTIONS)
    .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
    .json(
      new ApiResponse(201, { user: createdUser, accessToken }, "User registered successfully")
    );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isValid = await user.isPasswordCorrect(password);
  if (!isValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, COOKIE_OPTIONS)
    .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
    .json(
      new ApiResponse(200, { user: loggedInUser, accessToken }, "Login successful")
    );
});

import { uploadToCloudinary } from "../utils/cloudinary.js";
import Room from "../models/room.models.js";

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  return res
    .status(200)
    .clearCookie("accessToken", COOKIE_OPTIONS)
    .clearCookie("refreshToken", COOKIE_OPTIONS)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, organization, bio, username } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (username && username.trim().toLowerCase() !== user.username) {
    const existing = await User.findOne({
      username: username.trim().toLowerCase(),
      _id: { $ne: user._id },
    });
    if (existing) {
      throw new ApiError(409, "Username is already taken");
    }
    user.username = username.trim().toLowerCase();
  }

  if (fullName !== undefined) user.fullName = fullName.trim();
  if (organization !== undefined) user.organization = organization.trim();
  if (bio !== undefined) user.bio = bio.trim();

  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image file is required");
  }

  let avatarUrl = "";
  try {
    const cloudinaryResponse = await uploadToCloudinary(avatarLocalPath);
    if (cloudinaryResponse?.secure_url || cloudinaryResponse?.url) {
      avatarUrl = cloudinaryResponse.secure_url || cloudinaryResponse.url;
    } else {
      avatarUrl = `/temp/${req.file.filename}`;
    }
  } catch {
    avatarUrl = `/temp/${req.file.filename}`;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatarUrl } },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Find rooms this user has joined
  const rooms = await Room.find({ "members.user": user._id })
    .select("name code description createdAt")
    .sort({ updatedAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        rooms,
      },
      "User profile retrieved successfully"
    )
  );
});
