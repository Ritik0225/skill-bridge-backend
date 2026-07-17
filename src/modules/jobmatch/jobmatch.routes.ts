import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { aiLimiter } from "../../middleware/rateLimit.js";
import { validateBody } from "../../middleware/validate.js";
import { jobMatchRequestSchema } from "./jobmatch.schemas.js";
import * as controller from "./jobmatch.controller.js";

/** /api/v1/jobmatch — score readiness against a pasted job description (JWT-protected). */
export const jobMatchRouter = Router();
jobMatchRouter.use(requireAuth);
jobMatchRouter.post("/", aiLimiter, validateBody(jobMatchRequestSchema), controller.build);
jobMatchRouter.get("/", controller.get);
