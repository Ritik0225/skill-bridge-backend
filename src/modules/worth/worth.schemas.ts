import { z } from "zod";

export const worthRequestSchema = z.object({
  experienceYears: z.number().min(0).max(50),
  location: z.string().trim().min(1, "Location is required").max(100),
  targetRole: z.string().trim().min(1).max(100).optional(),
});

export type WorthRequest = z.infer<typeof worthRequestSchema>;
