import "server-only";
import { db } from "../../prisma/db";
import type { DeploymentEventInput } from "../validation/deployment-event";
import { mayAdvanceDeployment } from "../webhooks/deployment-policy";

const terminal = new Set(["SUCCEEDED", "FAILED", "CANCELLED"]);

export async function processDeploymentEvent(input: DeploymentEventInput) {
  const runId = input.runId ?? `commit:${input.commitSha}:attempt:${input.runAttempt ?? 1}`;
  try {
    return await db.transaction(async (tx) => {
      const project = await tx.orm.public.Project.where({ slug: input.projectSlug, archivedAt: null }).first();
      if (!project) return { kind: "project-not-found" as const };
      const environment = await tx.orm.public.Environment.where({ projectId: project.id, type: input.environment }).first();
      if (!environment) return { kind: "environment-not-found" as const };

      const deployment = await tx.orm.public.Deployment.where({ projectId: project.id, environmentId: environment.id, runId }).first();

      if (deployment) {
        const duplicate = await tx.orm.public.DeploymentEvent.where({ deploymentId: deployment.id, externalEventId: input.eventId }).first();
        if (duplicate) return { kind: "duplicate" as const };
      }

      const latestEvent = deployment && await tx.orm.public.DeploymentEvent.where({ deploymentId: deployment.id }).orderBy((event) => event.occurredAt.desc()).first();

      const eventDeployment = deployment ?? await tx.orm.public.Deployment.create({
        projectId: project.id,
        environmentId: environment.id,
        commitSha: input.commitSha,
        imageRef: input.imageRef,
        status: input.status,
        startedAt: input.status === "PENDING" ? null : input.occurredAt,
        finishedAt: terminal.has(input.status) ? input.occurredAt : null,
        failureMessage: input.status === "FAILED" ? input.message ?? null : null,
        runId,
        runAttempt: input.runAttempt ?? null,
        rollbackOfId: null,
      });

      await tx.orm.public.DeploymentEvent.create({
        id: input.eventId,
        deploymentId: eventDeployment.id,
        externalEventId: input.eventId,
        type: "deployment.status",
        status: input.status,
        message: input.message ?? null,
        occurredAt: input.occurredAt,
      });

      if (deployment && mayAdvanceDeployment(deployment.status, latestEvent?.occurredAt ?? deployment.finishedAt ?? deployment.startedAt, input.status, input.occurredAt)) {
        await tx.orm.public.Deployment.where({ id: deployment.id }).update({
          status: input.status,
          commitSha: input.commitSha,
          imageRef: input.imageRef,
          startedAt: deployment.startedAt ?? (input.status === "PENDING" ? null : input.occurredAt),
          finishedAt: terminal.has(input.status) ? input.occurredAt : null,
          failureMessage: input.status === "FAILED" ? input.message ?? null : null,
          runAttempt: input.runAttempt ?? deployment.runAttempt,
        });
      }
      return { kind: "processed" as const, deploymentId: eventDeployment.id };
    });
  } catch (error) {
    // A concurrent retry can win the unique event constraint before this transaction.
    if (await db.orm.public.DeploymentEvent.where({ id: input.eventId }).first()) return { kind: "duplicate" as const };
    throw error;
  }
}

export async function listProjectDeployments(ownerId: string, projectId: string) {
  const project = await db.orm.public.Project.where({ id: projectId, ownerId, archivedAt: null }).first();
  if (!project) return null;
  const deployments = await db.orm.public.Deployment.where({ projectId: project.id }).orderBy((item) => item.createdAt.desc()).all();
  const environments = await db.orm.public.Environment.where({ projectId: project.id }).all();
  const events = await Promise.all(deployments.map((item) => db.orm.public.DeploymentEvent.where({ deploymentId: item.id }).orderBy((event) => event.occurredAt.asc()).all()));
  return deployments.map((item, index) => ({
    ...item,
    environment: environments.find((environment) => environment.id === item.environmentId) ?? null,
    events: events[index] ?? [],
  }));
}

export async function getDashboardDeployments(ownerId: string) {
  const projects = await db.orm.public.Project.where({ ownerId, archivedAt: null }).all();
  const rows = await Promise.all(projects.map(async (project) => {
    const environments = await db.orm.public.Environment.where({ projectId: project.id }).all();
    const deployments = await db.orm.public.Deployment.where({ projectId: project.id }).orderBy((item) => item.createdAt.desc()).all();
    return { project, environments, deployments };
  }));
  return rows;
}

export async function createRollback(ownerId: string, projectId: string, deploymentId: string) {
  return db.transaction(async (tx) => {
    const project = await tx.orm.public.Project.where({ id: projectId, ownerId, archivedAt: null }).first();
    if (!project) return null;
    const original = await tx.orm.public.Deployment.where({ id: deploymentId, projectId: project.id }).first();
    if (!original || original.status !== "SUCCEEDED" || !original.imageRef) return null;
    const rollback = await tx.orm.public.Deployment.create({
      projectId: project.id,
      environmentId: original.environmentId,
      commitSha: original.commitSha,
      imageRef: original.imageRef,
      status: "PENDING",
      startedAt: null,
      finishedAt: null,
      failureMessage: null,
      runId: null,
      runAttempt: null,
      rollbackOfId: original.id,
    });
    await tx.orm.public.AuditLog.create({
      actorId: ownerId,
      action: "deployment.rollback_recorded",
      entityType: "Project",
      entityId: project.id,
      metadata: { projectId: project.id, rollbackOfId: original.id },
    });
    return rollback;
  });
}

export async function listProjectAuditLogs(ownerId: string, projectId: string) {
  const project = await db.orm.public.Project.where({ id: projectId, ownerId }).first();
  if (!project) return null;
  return db.orm.public.AuditLog.where({ entityType: "Project", entityId: project.id })
    .orderBy((entry) => entry.createdAt.desc())
    .all();
}
