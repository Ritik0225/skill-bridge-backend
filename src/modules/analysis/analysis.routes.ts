import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { aiLimiter } from "../../middleware/rateLimit.js";
import { validateBody } from "../../middleware/validate.js";
import { analysisRequestSchema } from "./analysis.schemas.js";
import * as controller from "./analysis.controller.js";

/** /api/v1/analysis — gap analysis + learning plan (JWT-protected). */
export const analysisRouter = Router();
analysisRouter.use(requireAuth);
analysisRouter.post("/", aiLimiter, validateBody(analysisRequestSchema), controller.build);
analysisRouter.get("/", controller.get);
