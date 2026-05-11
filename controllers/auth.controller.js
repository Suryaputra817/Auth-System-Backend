import userModel from "../Models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";

async function registerUser(req, res) {
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
    password,
    email,
  });
  const token = jwt.sign(
    {
      id: userModel._id,
    },
    config.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );
  res.status(201).json({
    message: "User registered successfully",
    user: {
      username,
      email,
      token,
    },
  });
}

export default registerUser;
