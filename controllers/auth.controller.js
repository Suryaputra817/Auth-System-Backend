import userModel from "../Models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";

export async function registerUser(req, res) {
  const { username, password, email } = req.body;
  const isAlreadyRegistered = await userModel.findOne({
    $or: [{ username }, { email }],
  });
  if (isAlreadyRegistered) {
    res.status(409).json({
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
  const token = jwt.sign(
    {
      id: newUser._id.toString(),
    },
    config.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );
  return res.status(201).json({
    message: "User registered successfully",
    user: {
      username,
      email,
      token,
    },
  });
}

export async function getMe(req, res) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "token not found",
    });
  }
  const decoded = jwt.verify(token, config.JWT_SECRET);
  console.log(decoded);
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
