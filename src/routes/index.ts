import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { ingestRouter, sourcesRouter } from "../modules/ingestion/ingestion.routes.js";
import { profileRouter } from "../modules/profile/profile.routes.js";
import { benchmarkRouter } from "../modules/benchmark/benchmark.routes.js";
import { analysisRouter } from "../modules/analysis/analysis.routes.js";
import { projectsRouter } from "../modules/projects/projects.routes.js";
import { interviewRouter } from "../modules/interview/interview.routes.js";
import { jobMatchRouter } from "../modules/jobmatch/jobmatch.routes.js";
import { worthRouter } from "../modules/worth/worth.routes.js";
import { careerRouter } from "../modules/career/career.routes.js";

/**
 * Root API router mounted at /api/v1.
 * Feature routers (auth, ingestion, profile, ...) are added here as slices land.
 */
export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  res.json({ name: "SkillBridge API", version: "v1", status: "ok" });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/ingest", ingestRouter);
apiRouter.use("/sources", sourcesRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/benchmark", benchmarkRouter);
apiRouter.use("/analysis", analysisRouter);
apiRouter.use("/projects", projectsRouter);
apiRouter.use("/interview", interviewRouter);
apiRouter.use("/jobmatch", jobMatchRouter);
apiRouter.use("/worth", worthRouter);
apiRouter.use("/career", careerRouter);
