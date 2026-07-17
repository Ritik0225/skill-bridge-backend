import { z } from "zod";

export const analysisRequestSchema = z.object({
  targetRole: z.string().trim().min(1, "Target role is required").max(100),
});

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
