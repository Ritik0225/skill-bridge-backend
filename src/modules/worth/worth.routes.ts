import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { aiLimiter } from "../../middleware/rateLimit.js";
import { validateBody } from "../../middleware/validate.js";
import { worthRequestSchema } from "./worth.schemas.js";
import * as controller from "./worth.controller.js";

/** /api/v1/worth — rough (low-confidence) market-worth estimate (JWT-protected). */
export const worthRouter = Router();
worthRouter.use(requireAuth);
worthRouter.post("/", aiLimiter, validateBody(worthRequestSchema), controller.build);
worthRouter.get("/", controller.get);
