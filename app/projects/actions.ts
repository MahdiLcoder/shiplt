"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  archiveProject,
  createProject,
  saveEnvironment,
  saveRepository,
  updateProject,
} from "../../lib/data/projects";
import { projectIdSchema, projectSchema } from "../../lib/validation/project";
import {
  environmentSchema,
  repositorySchema,
} from "../../lib/validation/project-settings";

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

export async function saveRepositoryAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const projectId = projectIdSchema.safeParse(formData.get("projectId"));
  if (!projectId.success) redirect("/projects?error=not-found");

  const repository = repositorySchema.safeParse({
    owner: formData.get("owner"),
    name: formData.get("name"),
  });
  if (!repository.success) {
    redirect(`/projects/${projectId.data}?error=repository-invalid`);
  }

  let savedRepository;
  try {
    savedRepository = await saveRepository(userId, projectId.data, repository.data);
  } catch {
    redirect(`/projects/${projectId.data}?error=repository-save`);
  }

  if (!savedRepository) redirect("/projects?error=not-found");
  revalidatePath(`/projects/${projectId.data}`);
  redirect(`/projects/${projectId.data}`);
}

export async function saveEnvironmentAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const projectId = projectIdSchema.safeParse(formData.get("projectId"));
  if (!projectId.success) redirect("/projects?error=not-found");

  const environment = environmentSchema.safeParse({
    type: formData.get("type"),
    deployTarget: formData.get("deployTarget"),
    configRef: formData.get("configRef"),
  });
  if (!environment.success) {
    redirect(`/projects/${projectId.data}?error=environment-invalid`);
  }

  let savedEnvironment;
  try {
    savedEnvironment = await saveEnvironment(
      userId,
      projectId.data,
      environment.data,
    );
  } catch {
    redirect(`/projects/${projectId.data}?error=environment-save`);
  }

  if (!savedEnvironment) redirect("/projects?error=not-found");
  revalidatePath(`/projects/${projectId.data}`);
  redirect(`/projects/${projectId.data}`);
}
