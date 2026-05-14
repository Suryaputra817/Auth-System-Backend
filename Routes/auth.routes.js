import { Router } from "express";
import {
  registerUser,
  getMe,
  refreshToken,
  logout,
  logoutAll,
  login,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { verify } from "crypto";

const authRouter = Router();
authRouter.post("/register", registerUser);
authRouter.post("/login", login);

authRouter.get("/get-me", getMe);
authRouter.get("/refresh-token", refreshToken);

authRouter.get("/logout", logout);
authRouter.get("/logout-all", logoutAll);

authRouter.get("/verify-email",verifyEmail);
export default authRouter;
