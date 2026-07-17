import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { aiLimiter } from "../../middleware/rateLimit.js";
import { validateBody } from "../../middleware/validate.js";
import { uploadPdf } from "../../middleware/upload.js";
import { githubSchema, portfolioSchema } from "./ingestion.schemas.js";
import * as controller from "./ingestion.controller.js";

/** POST /api/v1/ingest/* — start ingesting a source (all JWT-protected). */
export const ingestRouter = Router();
ingestRouter.use(requireAuth);
ingestRouter.post("/resume", aiLimiter, uploadPdf, controller.ingestResume);
ingestRouter.post("/linkedin", aiLimiter, uploadPdf, controller.ingestLinkedin);
ingestRouter.post("/github", aiLimiter, validateBody(githubSchema), controller.ingestGithub);
ingestRouter.post("/portfolio", aiLimiter, validateBody(portfolioSchema), controller.ingestPortfolio);

/** GET /api/v1/sources — list + poll ingested sources (JWT-protected). */
export const sourcesRouter = Router();
sourcesRouter.use(requireAuth);
sourcesRouter.get("/", controller.list);
sourcesRouter.get("/:id", controller.getOne);
sourcesRouter.delete("/:id", controller.remove);
