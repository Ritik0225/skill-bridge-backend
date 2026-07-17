import { z } from "zod";

export const githubSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/, "Invalid GitHub username"),
  token: z.string().trim().optional(),
});

export const portfolioSchema = z.object({
  url: z.string().trim().url("A valid URL is required"),
});

export type GithubInput = z.infer<typeof githubSchema>;
export type PortfolioInput = z.infer<typeof portfolioSchema>;
