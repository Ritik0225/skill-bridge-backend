import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {isTest} from "../../config/env.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.schemas.js";
import * as authController from "./auth.controller.js";

// Throttle credential endpoints to slow brute-force / abuse.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: { error: { code: "rate_limited", message: "Too many attempts, try again later" } },
});

export const authRouter = Router();

authRouter.post("/register", authLimiter, validateBody(registerSchema), authController.register);
authRouter.post("/login", authLimiter, validateBody(loginSchema), authController.login);
authRouter.get("/me", requireAuth, authController.me);
authRouter.post("/forgot-password", authLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
authRouter.post("/reset-password", authLimiter, validateBody(resetPasswordSchema), authController.resetPassword);
