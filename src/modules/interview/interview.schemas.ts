import { z } from "zod";

export const interviewRequestSchema = z.object({
  targetRole: z.string().trim().min(1).max(100).optional(),
});

export type InterviewRequest = z.infer<typeof interviewRequestSchema>;

export const assessRequestSchema = z.object({
  question: z.string().trim().min(5).max(2000),
  answer: z.string().trim().min(2, "Write an answer first").max(5000),
  topic: z.string().trim().max(120).optional(),
});

export type AssessRequest = z.infer<typeof assessRequestSchema>;
