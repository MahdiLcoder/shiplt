import "server-only";
import { db } from "../../prisma/db";
import type { ProjectInput } from "../validation/project";

export async function listProjects(ownerId: string) {
  return db.orm.public.Project.where({ ownerId, archivedAt: null })
    .orderBy((project) => project.createdAt.desc())
    .all();
}

export async function getProject(ownerId: string, id: string) {
  return db.orm.public.Project.where({ id, ownerId, archivedAt: null }).first();
}

export async function createProject(ownerId: string, input: ProjectInput) {
  return db.orm.public.Project.create({
    ...input,
    ownerId,
    archivedAt: null,
  });
}

export async function updateProject(
  ownerId: string,
  id: string,
  input: ProjectInput,
) {
  return db.orm.public.Project.where({ id, ownerId, archivedAt: null }).update(input);
}

export async function archiveProject(ownerId: string, id: string) {
  return db.orm.public.Project.where({ id, ownerId, archivedAt: null }).update({
    archivedAt: new Date().toISOString(),
  });
}
