import { z } from "zod";

export const careerRequestSchema = z.object({
  targetRole: z.string().trim().min(1).max(100).optional(),
});

export type CareerRequest = z.infer<typeof careerRequestSchema>;
