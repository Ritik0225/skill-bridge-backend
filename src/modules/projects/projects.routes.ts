import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { aiLimiter } from "../../middleware/rateLimit.js";
import * as controller from "./projects.controller.js";

/** /api/v1/projects — generate & list gap-closing project specs (JWT-protected). */
export const projectsRouter = Router();
projectsRouter.use(requireAuth);
projectsRouter.post("/generate", aiLimiter, controller.generate);
projectsRouter.get("/", controller.list);
