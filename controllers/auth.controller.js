import userModel from "../Models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import cookieParser from "cookie-parser";
import sessionModel from "../Models/session.model.js";
import sendEmail from "../services/email.service.js";
import { generateOTP, getOTPHtml } from "../utils/utils.js";
import OTP from "../Models/otp.model.js";

export async function registerUser(req, res) {
  const { username, password, email } = req.body;
  const isAlreadyRegistered = await userModel.findOne({
    $or: [{ username }, { email }],
  });
  if (isAlreadyRegistered) {
    return res.status(409).json({
      message: "Username or email already exist",
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
    verified: false,
  });

  const otp = generateOTP();
  const otpHtml = getOTPHtml(otp);
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  await OTP.create({
    email,
    user: newUser._id.toString(),
    otpHash,
  });
  await sendEmail(email, "Verify your email", otpHtml);

  return res.status(201).json({
    message: "User registered successfull",
    user: {
      username,
      email,
      verified: newUser.verified,
    },
  });
}

export async function login(req, res) {
  const { username, password } = req.body;
  const user = await userModel.findOne({ username });
  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }
  if (!user.verified) {
    return res.status(403).json({
      message: "Email not verified",
    });
  }
  const hashedPassword = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
  if (hashedPassword !== user.password) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }
  const refreshToken = jwt.sign(
    {
      id: user._id.toString(),
    },
    config.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await sessionModel.create({
    user: user._id.toString(),
    refreshTokenHash,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });

  const accessToken = jwt.sign(
    {
      id: user._id.toString(),
      sessionId: session._id.toString(),
    },
    config.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false, // false in dev (HTTP), true in prod (HTTPS)
    sameSite: "lax", // 'lax' for local dev, 'strict' for prod
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(200).json({
    message: "User logged in successfully",
    user: {
      username: user.username,
      email: user.email,
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

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");
  const session = await sessionModel.findOne({
    refreshTokenHash,
    revoked: false,
  });
  if (!session) {
    return res.status(404).json({
      message: "Session not found",
    });
  }
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
  const newRefreshTokenHash = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");
  session.refreshTokenHash = newRefreshTokenHash;
  await session.save();
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

export async function logout(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({
      message: "Refresh token not found",
    });
  }
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");
  const session = await sessionModel.findOne({
    refreshTokenHash,
    revoked: false,
  });
  if (!session) {
    return res.status(404).json({
      message: "Session not found",
    });
  }
  session.revoked = true;
  await session.save();
  res.clearCookie("refreshToken");
  return res.status(200).json({
    message: "Logged out successfully",
  });
}

export async function logoutAll(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({
      message: "Refresh token not found",
    });
  }
  const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
  await sessionModel.updateMany(
    {
      user: decoded.id,
      revoked: false,
    },
    {
      revoked: true,
    },
  );

  res.clearCookie("refreshToken");
  return res.status(200).json({
    message: "Logged out from all sessions successfully",
  });
}

export async function verifyEmail(req, res) {
  const { email, otp } = req.body;
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const otpRecord = await OTP.findOne({
    email,
    otpHash,
  });
  if (!otpRecord) {
    return res.status(400).json({
      message: "Invalid OTP",
    });
  }
  const user = await userModel.findByIdAndUpdate(otpRecord.user, { verified: true });
  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }
  await OTP.deleteMany({ email, otpHash });
  return res.status(200).json({
    message: "Email verified successfully",
    user: {
      username: user.username,
      email: user.email,
      verified: user.verified,
    },
  });
}