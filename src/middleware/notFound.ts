import type { RequestHandler } from "express";

/** Catches unmatched routes and returns the standard error envelope. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: "not_found",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
};
