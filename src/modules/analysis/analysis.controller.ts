import { asyncHandler } from "../../utils/asyncHandler.js";
import { unauthorized } from "../../utils/errors.js";
import * as service from "./analysis.service.js";

function userId(req: { user?: { id: string } }): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}

export const build = asyncHandler(async (req, res) => {
  const { gapAnalysis, learningPlan } = await service.buildAnalysis(userId(req), req.body);
  res.json({ gapAnalysis: gapAnalysis.toJSON(), learningPlan: learningPlan.toJSON() });
});

export const get = asyncHandler(async (req, res) => {
  const { gapAnalysis, learningPlan } = await service.getAnalysis(userId(req));
  res.json({
    gapAnalysis: gapAnalysis.toJSON(),
    learningPlan: learningPlan ? learningPlan.toJSON() : null,
  });
});
