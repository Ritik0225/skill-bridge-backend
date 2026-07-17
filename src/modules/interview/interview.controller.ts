import { asyncHandler } from "../../utils/asyncHandler.js";
import { unauthorized } from "../../utils/errors.js";
import * as service from "./interview.service.js";

function userId(req: { user?: { id: string } }): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}

export const build = asyncHandler(async (req, res) => {
  const doc = await service.buildInterview(userId(req), req.body);
  res.json({ interview: doc.toJSON() });
});

export const get = asyncHandler(async (req, res) => {
  const doc = await service.getInterview(userId(req));
  res.json({ interview: doc.toJSON() });
});

export const assess = asyncHandler(async (req, res) => {
  const doc = await service.assessAnswer(userId(req), req.body);
  res.json({ assessment: doc.toJSON() });
});

export const answers = asyncHandler(async (req, res) => {
  const { answers: docs, stats } = await service.listAnswers(userId(req));
  res.json({ answers: docs.map((d) => d.toJSON()), stats });
});
