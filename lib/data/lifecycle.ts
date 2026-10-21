import "server-only";
import { db } from "../../prisma/db";

export async function archiveClerkUserProjects(userId: string, eventId: string) {
  const auditId = `clerk:${eventId}`;
  try {
    return await db.transaction(async (tx) => {
      if (await tx.orm.public.AuditLog.where({ id: auditId }).first()) return false;
      const projects = await tx.orm.public.Project.where({ ownerId: userId, archivedAt: null }).all();
      for (const project of projects) {
        await tx.orm.public.Project.where({ id: project.id, ownerId: userId, archivedAt: null }).update({ archivedAt: new Date().toISOString() });
      }
      await tx.orm.public.AuditLog.create({
        id: auditId,
        actorId: userId,
        action: "clerk.user_deleted",
        entityType: "ClerkEvent",
        entityId: eventId,
        metadata: { archivedProjectCount: projects.length },
      });
      return true;
    });
  } catch (error) {
    if (await db.orm.public.AuditLog.where({ id: auditId }).first()) return false;
    throw error;
  }
}

export async function recordClerkLifecycleEvent(userId: string, eventId: string, action: string) {
  const auditId = `clerk:${eventId}`;
  try {
    return await db.transaction(async (tx) => {
      if (await tx.orm.public.AuditLog.where({ id: auditId }).first()) return false;
      await tx.orm.public.AuditLog.create({
        id: auditId,
        actorId: userId,
        action,
        entityType: "ClerkEvent",
        entityId: eventId,
        metadata: {},
      });
      return true;
    });
  } catch (error) {
    if (await db.orm.public.AuditLog.where({ id: auditId }).first()) return false;
    throw error;
  }
}
