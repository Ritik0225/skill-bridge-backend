import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * The skill-level benchmark — one per user, comparing their Current State against
 * what's expected for their experience (and optional target role).
 */
const skillBenchmarkSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    profileId: { type: Schema.Types.ObjectId, ref: "Profile" },
    experienceYears: { type: Number, required: true },
    targetRole: { type: String, default: null },
    currentLevel: { type: String, default: "unknown" },
    expectedLevel: { type: String, default: "unknown" },
    /** Overall: ahead / on_track / behind. */
    verdict: { type: String, default: "on_track" },
    summary: { type: String, default: "" },
    strengths: { type: [String], default: [] },
    focusAreas: { type: [String], default: [] },
    perSkill: { type: [Schema.Types.Mixed], default: [] },
    version: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export type SkillBenchmarkType = InferSchemaType<typeof skillBenchmarkSchema>;
export const SkillBenchmarkModel = model("SkillBenchmark", skillBenchmarkSchema);
