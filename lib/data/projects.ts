import "server-only";
import { db } from "../../prisma/db";
import type { ProjectInput } from "../validation/project";
import type {
  EnvironmentInput,
  RepositoryInput,
} from "../validation/project-settings";

export async function listProjects(ownerId: string) {
  return db.orm.public.Project.where({ ownerId, archivedAt: null })
    .orderBy((project) => project.createdAt.desc())
    .all();
}

export async function getProject(ownerId: string, id: string) {
  return db.orm.public.Project.where({ id, ownerId, archivedAt: null }).first();
}

export async function getProjectWorkspace(ownerId: string, id: string) {
  const project = await getProject(ownerId, id);
  if (!project) return null;

  const [repository, environments] = await Promise.all([
    db.orm.public.Repository.where({ projectId: project.id }).first(),
    db.orm.public.Environment.where({ projectId: project.id })
      .orderBy((environment) => environment.type.asc())
      .all(),
  ]);

  return { project, repository, environments };
}

export async function createProject(ownerId: string, input: ProjectInput) {
  return db.transaction(async (tx) => {
    const project = await tx.orm.public.Project.create({
      ...input,
      ownerId,
      archivedAt: null,
    });

    for (const type of ["DEVELOPMENT", "STAGING", "PRODUCTION"] as const) {
      await tx.orm.public.Environment.create({
        projectId: project.id,
        type,
        deployTarget: null,
        configRef: null,
      });
    }

    await tx.orm.public.AuditLog.create({
      actorId: ownerId,
      action: "project.created",
      entityType: "Project",
      entityId: project.id,
      metadata: { slug: project.slug },
    });

    return project;
  });
}

export async function updateProject(
  ownerId: string,
  id: string,
  input: ProjectInput,
) {
  return db.transaction(async (tx) => {
    const project = await tx.orm.public.Project.where({ id, ownerId, archivedAt: null }).update(input);
    if (project) await tx.orm.public.AuditLog.create({ actorId: ownerId, action: "project.updated", entityType: "Project", entityId: id, metadata: { slug: project.slug } });
    return project;
  });
}

export async function archiveProject(ownerId: string, id: string) {
  return db.transaction(async (tx) => {
    const project = await tx.orm.public.Project.where({ id, ownerId, archivedAt: null }).update({ archivedAt: new Date().toISOString() });
    if (project) await tx.orm.public.AuditLog.create({ actorId: ownerId, action: "project.archived", entityType: "Project", entityId: id, metadata: {} });
    return project;
  });
}

export async function saveRepository(
  ownerId: string,
  projectId: string,
  input: RepositoryInput,
) {
  return db.transaction(async (tx) => {
    const project = await tx.orm.public.Project.where({ id: projectId, ownerId, archivedAt: null }).first();
    if (!project) return null;
    const existing = await tx.orm.public.Repository.first({ projectId: project.id });
    const url = `https://github.com/${input.owner}/${input.name}`;
    const repository = existing
      ? await tx.orm.public.Repository.where({ projectId: project.id }).update({ owner: input.owner, name: input.name, url })
      : await tx.orm.public.Repository.create({ projectId: project.id, owner: input.owner, name: input.name, url });
    if (repository) await tx.orm.public.AuditLog.create({ actorId: ownerId, action: existing ? "repository.updated" : "repository.created", entityType: "Project", entityId: project.id, metadata: { owner: input.owner, name: input.name } });
    return repository;
  });
}

export async function saveEnvironment(
  ownerId: string,
  projectId: string,
  input: EnvironmentInput,
) {
  return db.transaction(async (tx) => {
    const project = await tx.orm.public.Project.where({ id: projectId, ownerId, archivedAt: null }).first();
    if (!project) return null;
    const existing = await tx.orm.public.Environment.first({ projectId: project.id, type: input.type });
    const values = { deployTarget: input.deployTarget, configRef: input.configRef };
    const environment = existing
      ? await tx.orm.public.Environment.where({ projectId: project.id, type: input.type }).update(values)
      : await tx.orm.public.Environment.create({ projectId: project.id, type: input.type, ...values });
    if (environment) await tx.orm.public.AuditLog.create({ actorId: ownerId, action: "environment.updated", entityType: "Project", entityId: project.id, metadata: { type: input.type, deployTarget: input.deployTarget, configRef: input.configRef } });
    return environment;
  });
}
