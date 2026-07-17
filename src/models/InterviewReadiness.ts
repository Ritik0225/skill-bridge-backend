import { Schema, model, type InferSchemaType } from "mongoose";

/** Interview readiness assessment + tailored question sets — one per user. */
const interviewReadinessSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    targetRole: { type: String, default: null },
    level: { type: String, default: "unknown" },
    readinessScore: { type: Number, default: 0 },
    summary: { type: String, default: "" },
    strengths: { type: [String], default: [] },
    weakAreas: { type: [String], default: [] },
    /** [{ topic, questions: [{ question, hint? }] }] */
    questionSets: { type: [Schema.Types.Mixed], default: [] },
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

export type InterviewReadinessType = InferSchemaType<typeof interviewReadinessSchema>;
export const InterviewReadinessModel = model("InterviewReadiness", interviewReadinessSchema);
