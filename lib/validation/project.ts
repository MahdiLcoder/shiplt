import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters.").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug must be at least 2 characters.")
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  description: z.string().trim().max(500).optional().transform((value) => value || null),
});

export const projectIdSchema = z.string().min(1);

export type ProjectInput = z.infer<typeof projectSchema>;
