"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  archiveProject,
  createProject,
  updateProject,
} from "../../lib/data/projects";
import { projectIdSchema, projectSchema } from "../../lib/validation/project";

function readProjectInput(formData: FormData) {
  return projectSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
  });
}

export async function createProjectAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const parsed = readProjectInput(formData);
  if (!parsed.success) redirect(`/projects/new?error=invalid`);

  let project;
  try {
    project = await createProject(userId, parsed.data);
  } catch {
    redirect("/projects/new?error=save");
  }

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProjectAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const id = projectIdSchema.safeParse(formData.get("projectId"));
  if (!id.success) redirect("/projects?error=not-found");

  const parsed = readProjectInput(formData);
  if (!parsed.success) redirect(`/projects/${id.data}/edit?error=invalid`);

  let project;
  try {
    project = await updateProject(userId, id.data, parsed.data);
  } catch {
    redirect(`/projects/${id.data}/edit?error=save`);
  }

  if (!project) redirect("/projects?error=not-found");
  revalidatePath("/projects");
  revalidatePath(`/projects/${id.data}`);
  redirect(`/projects/${id.data}`);
}

export async function archiveProjectAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const id = projectIdSchema.safeParse(formData.get("projectId"));
  if (!id.success) redirect("/projects?error=not-found");

  let project;
  try {
    project = await archiveProject(userId, id.data);
  } catch {
    redirect(`/projects/${id.data}?error=save`);
  }

  if (!project) redirect("/projects?error=not-found");
  revalidatePath("/projects");
  redirect("/projects");
}

