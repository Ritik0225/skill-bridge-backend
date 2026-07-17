import { Router } from "express";
import { isDbConnected } from "../config/db.js";

export const healthRouter = Router();

/** Liveness + readiness probe. Reports process uptime and DB connectivity. */
healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    db: isDbConnected() ? "connected" : "disconnected",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});
