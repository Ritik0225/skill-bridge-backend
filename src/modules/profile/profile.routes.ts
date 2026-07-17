import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { aiLimiter } from "../../middleware/rateLimit.js";
import * as controller from "./profile.controller.js";

/** /api/v1/profile — build & read the consolidated Current State (JWT-protected). */
export const profileRouter = Router();
profileRouter.use(requireAuth);
profileRouter.post("/build", aiLimiter, controller.build);
profileRouter.get("/", controller.get);
