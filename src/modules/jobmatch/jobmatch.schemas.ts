import { z } from "zod";

export const jobMatchRequestSchema = z.object({
  jdText: z
    .string()
    .trim()
    .min(30, "Paste a fuller job description (at least 30 characters)")
    .max(20000),
});

export type JobMatchRequest = z.infer<typeof jobMatchRequestSchema>;
