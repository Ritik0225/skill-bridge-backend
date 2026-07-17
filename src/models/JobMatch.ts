import { Schema, model, type InferSchemaType } from "mongoose";

/** Readiness assessment against a specific job description — one per user (latest JD). */
const jobMatchSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    jdText: { type: String, required: true },
    roleTitle: { type: String, default: "" },
    readinessScore: { type: Number, default: 0 },
    summary: { type: String, default: "" },
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    strongAreas: { type: [String], default: [] },
    weakAreas: { type: [String], default: [] },
    estimatedDaysToReady: { type: Number, default: 0 },
    recommendations: { type: [String], default: [] },
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

export type JobMatchType = InferSchemaType<typeof jobMatchSchema>;
export const JobMatchModel = model("JobMatch", jobMatchSchema);
