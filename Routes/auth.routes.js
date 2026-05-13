import { Router } from "express";
import {
  registerUser,
  getMe,
  refreshToken,
} from "../controllers/auth.controller.js";

const authRouter = Router();
authRouter.post("/register", registerUser);

authRouter.get("/get-me", getMe);
authRouter.get("/refresh-token", refreshToken);

export default authRouter;
