import { z } from "zod";

export const environmentTypeSchema = z.enum(["DEVELOPMENT", "STAGING", "PRODUCTION"]);
export const deploymentStatusSchema = z.enum(["PENDING", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED"]);

export const deploymentEventSchema = z.object({
  eventId: z.string().trim().min(1).max(200),
  projectSlug: z.string().trim().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  environment: environmentTypeSchema,
  commitSha: z.string().trim().min(1).max(200),
  imageRef: z.string().trim().min(1).max(1000),
  status: deploymentStatusSchema,
  message: z.string().max(2000).optional(),
  occurredAt: z.iso.datetime({ offset: true }),
  runId: z.string().trim().max(200).optional(),
  runAttempt: z.number().int().positive().optional(),
});

export type DeploymentEventInput = z.infer<typeof deploymentEventSchema>;
