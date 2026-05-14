import { Router } from "express";
import {
  registerUser,
  getMe,
  refreshToken,
  logout,
  logoutAll,
  login,
} from "../controllers/auth.controller.js";

const authRouter = Router();
authRouter.post("/register", registerUser);
authRouter.post("/login", login);

authRouter.get("/get-me", getMe);
authRouter.get("/refresh-token", refreshToken);

authRouter.get("/logout", logout);
authRouter.get("/logout-all", logoutAll);

export default authRouter;
