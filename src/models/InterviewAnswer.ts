import { Schema, model, type InferSchemaType } from "mongoose";

/** One practiced interview answer + its AI assessment. A user has many of these. */
const interviewAnswerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    question: { type: String, required: true },
    topic: { type: String, default: null },
    answer: { type: String, required: true },
    score: { type: Number, default: 0 },
    verdict: { type: String, default: "adequate" },
    summary: { type: String, default: "" },
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
    keyPoints: { type: [String], default: [] },
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

export type InterviewAnswerType = InferSchemaType<typeof interviewAnswerSchema>;
export const InterviewAnswerModel = model("InterviewAnswer", interviewAnswerSchema);
