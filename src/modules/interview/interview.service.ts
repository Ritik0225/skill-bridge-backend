import mongoose from "mongoose";
import { badRequest, notFound } from "../../utils/errors.js";
import { ProfileModel } from "../../models/Profile.js";
import { InterviewReadinessModel } from "../../models/InterviewReadiness.js";
import { InterviewAnswerModel } from "../../models/InterviewAnswer.js";
import { assessInterview, judgeAnswer } from "./interview.ai.js";
import type { AssessRequest, InterviewRequest } from "./interview.schemas.js";

interface ProfileSkill {
  name: string;
  category: string;
}

export async function buildInterview(userId: string, req: InterviewRequest) {
  const profile = await ProfileModel.findOne({ userId });
  if (!profile) {
    throw badRequest("Build your profile before checking interview readiness.");
  }

  const result = await assessInterview({
    targetRole: req.targetRole,
    seniority: String(profile.seniority),
    skills: (profile.skills as ProfileSkill[]).map((s) => ({ name: s.name, category: s.category })),
  });

  const doc = await InterviewReadinessModel.findOneAndUpdate(
    { userId },
    { $set: { targetRole: req.targetRole ?? null, ...result }, $inc: { version: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return doc;
}

export async function getInterview(userId: string) {
  const doc = await InterviewReadinessModel.findOne({ userId });
  if (!doc) throw notFound("No interview readiness yet. Run one after building your profile.");
  return doc;
}

/** Grade a single answer (LLM-as-judge) and store it in the user's practice history. */
export async function assessAnswer(userId: string, req: AssessRequest) {
  const readiness = await InterviewReadinessModel.findOne({ userId });
  const result = await judgeAnswer({
    question: req.question,
    answer: req.answer,
    topic: req.topic,
    level: readiness ? String(readiness.level) : undefined,
  });

  return InterviewAnswerModel.create({
    userId,
    question: req.question,
    topic: req.topic ?? null,
    answer: req.answer,
    ...result,
  });
}

export async function listAnswers(userId: string) {
  const answers = await InterviewAnswerModel.find({ userId }).sort({ createdAt: -1 }).limit(20);

  // Aggregate across ALL answers (not just the latest 20) so the average is accurate.
  const agg = await InterviewAnswerModel.aggregate<{ count: number; avg: number }>([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: "$score" } } },
  ]);
  const stats = agg[0]
    ? { count: agg[0].count, averageScore: Math.round(agg[0].avg) }
    : { count: 0, averageScore: 0 };

  return { answers, stats };
}
