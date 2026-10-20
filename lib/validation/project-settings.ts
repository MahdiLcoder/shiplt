import { z } from "zod";

export const repositorySchema = z.object({
  owner: z
    .string()
    .trim()
    .min(1, "Repository owner is required.")
    .max(39)
    .regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/),
  name: z
    .string()
    .trim()
    .min(1, "Repository name is required.")
    .max(100)
    .regex(/^[A-Za-z0-9._-]+$/),
});

export const environmentSchema = z.object({
  type: z.enum(["DEVELOPMENT", "STAGING", "PRODUCTION"]),
  deployTarget: z.string().trim().max(120).optional().transform((value) => value || null),
  configRef: z.string().trim().max(200).optional().transform((value) => value || null),
});

export type RepositoryInput = z.infer<typeof repositorySchema>;
export type EnvironmentInput = z.infer<typeof environmentSchema>;
