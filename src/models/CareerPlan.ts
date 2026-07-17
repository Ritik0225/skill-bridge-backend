import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Job-search + extra-income guidance — one per user.
 * Advice-level (not financial/career advice); the `caveat` is set by the service.
 */
const careerPlanSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    targetRole: { type: String, default: null },
    summary: { type: String, default: "" },
    jobSearchTips: { type: [String], default: [] },
    /** [{ niche, why }] */
    freelanceNiches: { type: [Schema.Types.Mixed], default: [] },
    /** [{ idea, effort: low|medium|high, basedOn }] */
    sideIncomeIdeas: { type: [Schema.Types.Mixed], default: [] },
    caveat: { type: String, default: "" },
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

export type CareerPlanType = InferSchemaType<typeof careerPlanSchema>;
export const CareerPlanModel = model("CareerPlan", careerPlanSchema);
