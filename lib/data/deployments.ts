import "server-only";
import { db } from "../../prisma/db";
import type { DeploymentEventInput } from "../validation/deployment-event";
import { mayAdvanceDeployment } from "../webhooks/deployment-policy";

const terminal = new Set(["SUCCEEDED", "FAILED", "CANCELLED"]);
const DEPLOYMENT_HISTORY_LIMIT = 100;
const DEPLOYMENT_EVENT_LIMIT = 100;

export async function processDeploymentEvent(input: DeploymentEventInput) {
  return processDeploymentEventAttempt(input, true);
}

async function processDeploymentEventAttempt(input: DeploymentEventInput, retryRunConflict: boolean) {
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
    // Concurrent deliveries can win either the event ID or deployment run key.
    if (await db.orm.public.DeploymentEvent.where({ id: input.eventId }).first()) return { kind: "duplicate" as const };
    if (retryRunConflict) {
      const project = await db.orm.public.Project.where({ slug: input.projectSlug, archivedAt: null }).first();
      const environment = project && await db.orm.public.Environment.where({ projectId: project.id, type: input.environment }).first();
      const existingRun = project && environment && await db.orm.public.Deployment.where({ projectId: project.id, environmentId: environment.id, runId }).first();
      if (existingRun) return processDeploymentEventAttempt(input, false);
    }
    throw error;
  }
}

export async function listProjectDeployments(ownerId: string, projectId: string) {
  const project = await db.orm.public.Project.where({ id: projectId, ownerId, archivedAt: null }).first();
  if (!project) return null;
  const deployments = await db.orm.public.Deployment.where({ projectId: project.id }).orderBy((item) => item.createdAt.desc()).limit(DEPLOYMENT_HISTORY_LIMIT).all();
  const environments = await db.orm.public.Environment.where({ projectId: project.id }).all();
  return deployments.map((item) => ({
    ...item,
    environment: environments.find((environment) => environment.id === item.environmentId) ?? null,
  }));
}

export async function getProjectReleaseSummaries(ownerId: string, projectId: string) {
  const project = await db.orm.public.Project.where({ id: projectId, ownerId, archivedAt: null }).first();
  if (!project) return null;
  const environments = await db.orm.public.Environment.where({ projectId: project.id }).all();
  return Promise.all(environments.map(async (environment) => {
    const [latest, latestSuccessful] = await Promise.all([
      db.orm.public.Deployment.where({ projectId: project.id, environmentId: environment.id }).orderBy((item) => item.createdAt.desc()).first(),
      db.orm.public.Deployment.where({ projectId: project.id, environmentId: environment.id, status: "SUCCEEDED" }).orderBy((item) => item.createdAt.desc()).first(),
    ]);
    return { environmentId: environment.id, latest, latestSuccessful };
  }));
}

export async function getDashboardDeployments(ownerId: string, includeRecentStats = false) {
  const since = includeRecentStats ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() : undefined;
  const projects = await db.orm.public.Project.where({ ownerId, archivedAt: null }).all();
  const rows = await Promise.all(projects.map(async (project) => {
    const environments = await db.orm.public.Environment.where({ projectId: project.id }).all();
    const [deployments, latestByEnvironment, latestSuccessful, recentTotal, recentSuccessful] = await Promise.all([
      db.orm.public.Deployment.where({ projectId: project.id }).orderBy((item) => item.createdAt.desc()).limit(8).all(),
      Promise.all(environments.map(async (environment) => db.orm.public.Deployment.where({ projectId: project.id, environmentId: environment.id }).orderBy((item) => item.createdAt.desc()).first())),
      Promise.all(environments.map(async (environment) => db.orm.public.Deployment.where({ projectId: project.id, environmentId: environment.id, status: "SUCCEEDED" }).orderBy((item) => item.createdAt.desc()).first())),
      since ? db.orm.public.Deployment.where({ projectId: project.id }).where((item) => item.createdAt.gte(since)).aggregate((aggregate) => ({ count: aggregate.count() })) : Promise.resolve({ count: 0 }),
      since ? db.orm.public.Deployment.where({ projectId: project.id, status: "SUCCEEDED" }).where((item) => item.createdAt.gte(since)).aggregate((aggregate) => ({ count: aggregate.count() })) : Promise.resolve({ count: 0 }),
    ]);
    return {
      project,
      environments,
      deployments,
      latestByEnvironment: latestByEnvironment.filter((item) => item !== null),
      latestSuccessful: latestSuccessful.filter((item) => item !== null),
      recentCount: recentTotal.count,
      recentSuccessfulCount: recentSuccessful.count,
    };
  }));
  return rows;
}

export async function getProjectDeployment(ownerId: string, projectId: string, deploymentId: string) {
  const project = await db.orm.public.Project.where({ id: projectId, ownerId, archivedAt: null }).first();
  if (!project) return null;
  const deployment = await db.orm.public.Deployment.where({ id: deploymentId, projectId: project.id }).first();
  if (!deployment) return null;
  const [environment, events] = await Promise.all([
    db.orm.public.Environment.where({ id: deployment.environmentId, projectId: project.id }).first(),
    db.orm.public.DeploymentEvent.where({ deploymentId: deployment.id }).orderBy((event) => event.occurredAt.desc()).limit(DEPLOYMENT_EVENT_LIMIT).all(),
  ]);
  if (!environment) return null;
  return { ...deployment, environment, events: events.reverse() };
}

export async function getLatestEnvironmentDeployment(ownerId: string, projectId: string, environmentId: string) {
  const project = await db.orm.public.Project.where({ id: projectId, ownerId, archivedAt: null }).first();
  if (!project) return null;
  const environment = await db.orm.public.Environment.where({ id: environmentId, projectId: project.id }).first();
  if (!environment) return null;
  return db.orm.public.Deployment.where({ projectId: project.id, environmentId: environment.id })
    .orderBy((item) => item.createdAt.desc())
    .first();
}

export async function createRollback(ownerId: string, projectId: string, deploymentId: string) {
  return db.transaction(async (tx) => {
    const project = await tx.orm.public.Project.where({ id: projectId, ownerId, archivedAt: null }).first();
    if (!project) return null;
    const original = await tx.orm.public.Deployment.where({ id: deploymentId, projectId: project.id }).first();
    if (!original || original.status !== "SUCCEEDED" || !original.imageRef) return null;
    const environment = await tx.orm.public.Environment.where({ id: original.environmentId, projectId: project.id }).first();
    if (!environment) return null;
    const pendingRollback = await tx.orm.public.Deployment.where({ rollbackOfId: original.id, status: "PENDING" }).first();
    const runningRollback = await tx.orm.public.Deployment.where({ rollbackOfId: original.id, status: "RUNNING" }).first();
    if (pendingRollback || runningRollback) return pendingRollback ?? runningRollback;
    const rollback = await tx.orm.public.Deployment.create({
      projectId: project.id,
      environmentId: environment.id,
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
      metadata: { projectId: project.id, deploymentId: rollback.id, rollbackOfId: original.id },
    });
    return rollback;
  });
}

export async function listProjectAuditLogs(ownerId: string, projectId: string) {
  const project = await db.orm.public.Project.where({ id: projectId, ownerId }).first();
  if (!project) return null;
  return db.orm.public.AuditLog.where({ entityType: "Project", entityId: project.id })
    .orderBy((entry) => entry.createdAt.desc())
    .limit(100)
    .all();
}
