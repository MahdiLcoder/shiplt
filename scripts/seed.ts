import { db } from "../prisma/db";

const [ownerId, name, slug] = process.argv.slice(2);

if (!ownerId || !name || !slug) {
  throw new Error(
    "Usage: pnpm db:seed <clerk-owner-id> <project-name> <project-slug>",
  );
}

try {
  let project = await db.orm.public.Project.first({ slug });

  if (!project) {
    project = await db.orm.public.Project.create({ name, slug, ownerId });
  }

  const environmentTypes = ["DEVELOPMENT", "STAGING", "PRODUCTION"] as const;

  for (const type of environmentTypes) {
    const existingEnvironment = await db.orm.public.Environment.first({
      projectId: project.id,
      type,
    });

    if (!existingEnvironment) {
      await db.orm.public.Environment.create({
        projectId: project.id,
        type,
        deployTarget: null,
        configRef: null,
      });
    }
  }

  console.log(`Seeded project "${slug}" with its three environments.`);
} finally {
  await db.close();
}
