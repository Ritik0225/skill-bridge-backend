import { Schema, model, type InferSchemaType } from "mongoose";

/** Week-by-week learning plan linked to a gap analysis — one per user. */
const learningPlanSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    gapAnalysisId: { type: Schema.Types.ObjectId, ref: "GapAnalysis" },
    targetRole: { type: String, required: true },
    /** [{ week, focus, task, resources[] }] */
    weeks: { type: [Schema.Types.Mixed], default: [] },
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

export type LearningPlanType = InferSchemaType<typeof learningPlanSchema>;
export const LearningPlanModel = model("LearningPlan", learningPlanSchema);
