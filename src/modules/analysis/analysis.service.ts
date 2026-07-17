import { badRequest, notFound } from "../../utils/errors.js";
import { ProfileModel } from "../../models/Profile.js";
import { GapAnalysisModel } from "../../models/GapAnalysis.js";
import { LearningPlanModel } from "../../models/LearningPlan.js";
import { analyze } from "./analysis.ai.js";
import type { AnalysisRequest } from "./analysis.schemas.js";

interface ProfileSkill {
  name: string;
  category: string;
}
interface ProfileRole {
  title: string;
}

/** Run gap analysis + learning plan for a target role (one AI call), then persist both. */
export async function buildAnalysis(userId: string, req: AnalysisRequest) {
  const profile = await ProfileModel.findOne({ userId });
  if (!profile) {
    throw badRequest("Build your profile before running an analysis.");
  }

  const result = await analyze({
    targetRole: req.targetRole,
    seniority: String(profile.seniority),
    currentSkills: (profile.skills as ProfileSkill[]).map((s) => ({
      name: s.name,
      category: s.category,
    })),
    roles: (profile.roles as ProfileRole[]).map((r) => ({ title: r.title })),
  });

  const gapAnalysis = await GapAnalysisModel.findOneAndUpdate(
    { userId },
    { $set: { targetRole: req.targetRole, ...result.gap }, $inc: { version: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const learningPlan = await LearningPlanModel.findOneAndUpdate(
    { userId },
    {
      $set: {
        gapAnalysisId: gapAnalysis._id,
        targetRole: req.targetRole,
        weeks: result.plan.weeks,
      },
      $inc: { version: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return { gapAnalysis, learningPlan };
}

export async function getAnalysis(userId: string) {
  const gapAnalysis = await GapAnalysisModel.findOne({ userId });
  if (!gapAnalysis) {
    throw notFound("No analysis yet. Run one after building your profile.");
  }
  const learningPlan = await LearningPlanModel.findOne({ userId });
  return { gapAnalysis, learningPlan };
}
