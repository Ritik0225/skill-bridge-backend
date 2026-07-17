import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { aiLimiter } from "../../middleware/rateLimit.js";
import { validateBody } from "../../middleware/validate.js";
import { benchmarkRequestSchema } from "./benchmark.schemas.js";
import * as controller from "./benchmark.controller.js";

/** /api/v1/benchmark — assess & read skill level vs experience (JWT-protected). */
export const benchmarkRouter = Router();
benchmarkRouter.use(requireAuth);
benchmarkRouter.post("/", aiLimiter, validateBody(benchmarkRequestSchema), controller.build);
benchmarkRouter.get("/", controller.get);
