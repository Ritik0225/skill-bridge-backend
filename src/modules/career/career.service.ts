import { badRequest, notFound } from "../../utils/errors.js";
import { ProfileModel } from "../../models/Profile.js";
import { CareerPlanModel } from "../../models/CareerPlan.js";
import { planCareer } from "./career.ai.js";
import type { CareerRequest } from "./career.schemas.js";

interface ProfileSkill {
  name: string;
}

const CAVEAT =
  "General guidance, not financial or professional advice. Validate any idea against your own situation, local market, and legal/tax rules before acting.";

export async function buildCareerPlan(userId: string, req: CareerRequest) {
  const profile = await ProfileModel.findOne({ userId });
  if (!profile) {
    throw badRequest("Build your profile before generating a career plan.");
  }

  const result = await planCareer({
    targetRole: req.targetRole,
    seniority: String(profile.seniority),
    skills: (profile.skills as ProfileSkill[]).map((s) => s.name),
  });

  const doc = await CareerPlanModel.findOneAndUpdate(
    { userId },
    {
      $set: { targetRole: req.targetRole ?? null, ...result, caveat: CAVEAT },
      $inc: { version: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return doc;
}

export async function getCareerPlan(userId: string) {
  const doc = await CareerPlanModel.findOne({ userId });
  if (!doc) throw notFound("No career plan yet. Generate one after building your profile.");
  return doc;
}
