import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { aiLimiter } from "../../middleware/rateLimit.js";
import { validateBody } from "../../middleware/validate.js";
import { assessRequestSchema, interviewRequestSchema } from "./interview.schemas.js";
import * as controller from "./interview.controller.js";

/** /api/v1/interview — readiness, tailored questions, and answer assessment (JWT-protected). */
export const interviewRouter = Router();
interviewRouter.use(requireAuth);
interviewRouter.post("/readiness", aiLimiter, validateBody(interviewRequestSchema), controller.build);
interviewRouter.get("/", controller.get);
interviewRouter.post("/assess", aiLimiter, validateBody(assessRequestSchema), controller.assess);
interviewRouter.get("/answers", controller.answers);
