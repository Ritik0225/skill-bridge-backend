import { asyncHandler } from "../../utils/asyncHandler.js";
import { unauthorized } from "../../utils/errors.js";
import * as service from "./benchmark.service.js";

function userId(req: { user?: { id: string } }): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}

export const build = asyncHandler(async (req, res) => {
  const doc = await service.buildBenchmark(userId(req), req.body);
  res.json({ benchmark: doc.toJSON() });
});

export const get = asyncHandler(async (req, res) => {
  const doc = await service.getBenchmark(userId(req));
  res.json({ benchmark: doc.toJSON() });
});
