import userModel from "../Models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import cookieParser from "cookie-parser";

export async function registerUser(req, res) {
  const { username, password, email } = req.body;
  const isAlreadyRegistered = await userModel.findOne({
    $or: [{ username }, { email }],
  });
  if (isAlreadyRegistered) {
    return res.status(409).json({
      message: "Username or email already exists",
    });
  }
  const hashedPassword = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
  const newUser = await userModel.create({
    username,
    password: hashedPassword,
    email,
  });
  const accessToken = jwt.sign(
    {
      id: newUser._id.toString(),
    },
    config.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );
  const refreshToken = jwt.sign(
    {
      id: newUser._id.toString(),
    },
    config.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false, // false in dev (HTTP), true in prod (HTTPS)
    sameSite: "lax", // 'lax' for local dev, 'strict' for prod
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(201).json({
    message: "User registered successfully",
    user: {
      username,
      email,
      accessToken,
      refreshToken,
    },
  });
}

export async function getMe(req, res) {
  const accessToken = req.headers.authorization?.split(" ")[1];
  if (!accessToken) {
    return res.status(401).json({
      message: "Access token not found",
    });
  }
  const decoded = jwt.verify(accessToken, config.JWT_SECRET);
  // console.log(decoded);
  const user = await userModel.findById(decoded.id);
  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }
  return res.status(200).json({
    message: "User fetched successfully",
    user: {
      username: user.username,
      email: user.email,
    },
  });
}

export async function refreshToken(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({
      message: "Refresh token not found",
    });
  }
  const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
  const accessToken = jwt.sign(
    {
      id: decoded.id,
    },
    config.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );
  const newRefreshToken = jwt.sign(
    {
      id: decoded.id,
    },
    config.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: false, // false in dev (HTTP), true in prod (HTTPS)
    sameSite: "lax", // 'lax' for local dev, 'strict' for prod
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return res.status(200).json({
    message: "Access token refreshed successfully", //both tokens are refreshed but only access token is sent in response for frontend to use, refresh token is stored in cookie for security
    accessToken,
  });
}

