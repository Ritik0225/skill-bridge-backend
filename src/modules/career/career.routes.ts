import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { aiLimiter } from "../../middleware/rateLimit.js";
import { validateBody } from "../../middleware/validate.js";
import { careerRequestSchema } from "./career.schemas.js";
import * as controller from "./career.controller.js";

/** /api/v1/career — job-search + extra-income guidance (JWT-protected). */
export const careerRouter = Router();
careerRouter.use(requireAuth);
careerRouter.post("/plan", aiLimiter, validateBody(careerRequestSchema), controller.build);
careerRouter.get("/plan", controller.get);
