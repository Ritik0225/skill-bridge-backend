import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

async function main(): Promise<void> {
  const app = createApp();

  // Start listening first so /health responds even if the DB is unreachable.
  const server = app.listen(env.PORT, () => {
    logger.info(`SkillBridge API listening on http://localhost:${env.PORT}`);
  });

  // Attempt DB connection in the background; log but don't crash on failure.
  connectDb()
    .then(async () => {
      const { resetOrphanedSources } = await import("./modules/ingestion/ingestion.service.js");
      const reset = await resetOrphanedSources();
      if (reset > 0) {
        logger.info({ count: reset }, "Reset orphaned in-flight sources from a previous run");
      }
    })
    .catch((err) => {
      logger.error(
        { err },
        "Initial MongoDB connection failed — API is up, DB-backed routes will error until it recovers",
      );
    });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, "Shutting down");
    server.close(() => {
      void import("./config/db.js").then(({ disconnectDb }) =>
        disconnectDb().finally(() => process.exit(0)),
      );
    });
    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
