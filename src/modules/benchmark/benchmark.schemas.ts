import { z } from "zod";

export const benchmarkRequestSchema = z.object({
  experienceYears: z.number().min(0, "Experience can't be negative").max(50),
  targetRole: z.string().trim().min(1).max(100).optional(),
});

export type BenchmarkRequest = z.infer<typeof benchmarkRequestSchema>;
