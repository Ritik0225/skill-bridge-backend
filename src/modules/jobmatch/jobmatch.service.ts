import { badRequest, notFound } from "../../utils/errors.js";
import { ProfileModel } from "../../models/Profile.js";
import { JobMatchModel } from "../../models/JobMatch.js";
import { matchJob } from "./jobmatch.ai.js";
import type { JobMatchRequest } from "./jobmatch.schemas.js";

interface ProfileSkill {
  name: string;
  category: string;
}

export async function buildJobMatch(userId: string, req: JobMatchRequest) {
  const profile = await ProfileModel.findOne({ userId });
  if (!profile) {
    throw badRequest("Build your profile before matching a job.");
  }

  const result = await matchJob({
    jdText: req.jdText,
    seniority: String(profile.seniority),
    skills: (profile.skills as ProfileSkill[]).map((s) => ({ name: s.name, category: s.category })),
  });

  const doc = await JobMatchModel.findOneAndUpdate(
    { userId },
    { $set: { jdText: req.jdText, ...result }, $inc: { version: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return doc;
}

export async function getJobMatch(userId: string) {
  const doc = await JobMatchModel.findOne({ userId });
  if (!doc) throw notFound("No job match yet. Paste a job description after building your profile.");
  return doc;
}
