import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { io } from "next/cache";
import { updateProjectAction } from "../../actions";
import { getProject } from "../../../../lib/data/projects";
import { Input, Textarea } from "../../../../components/ui/primitives";
import { SubmitButton } from "../../../../components/ui/SubmitButton";

type EditProjectPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default function EditProjectPage(props: EditProjectPageProps) {
  return <Suspense fallback={<EditProjectFallback />}><EditProjectContent {...props} /></Suspense>;
}

async function EditProjectContent({
  params,
  searchParams,
}: EditProjectPageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  await io();
  let project;
  try {
    project = await getProject(userId, projectId);
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:px-10">
        <p role="alert" className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_9%,transparent)] p-4 text-sm text-[var(--danger)]">
          Project details could not be loaded. Please try again.
        </p>
      </main>
    );
  }
  if (!project) notFound();

  return (
    <main className="mx-auto max-w-3xl px-5 py-7 sm:px-8 lg:px-10">
      <Link href={`/projects/${project.id}`} className="text-sm font-medium text-muted hover:text-foreground">
        ← {project.name}
      </Link>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">Project settings</h1>
      <p className="mt-2 text-sm text-muted">Update the project name, deployment slug, and description.</p>

      {query.error && (
        <p role="alert" aria-live="polite" className="mt-6 rounded-lg border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_9%,transparent)] px-4 py-3 text-sm text-[var(--danger)]">
          {query.error === "invalid"
            ? "Check the project name, slug, and description, then try again."
            : "The project could not be saved. The slug may already be in use."}
        </p>
      )}

      <form action={updateProjectAction} className="mt-7 space-y-5 rounded-xl border border-border bg-surface p-5 sm:p-7">
        <input type="hidden" name="projectId" value={project.id} />
        <div>
          <label htmlFor="name" className="mb-2 block text-xs font-medium">Project name <span className="text-[var(--danger)]">*</span></label>
          <Input id="name" name="name" required minLength={2} maxLength={80} defaultValue={project.name} />
        </div>
        <div>
          <label htmlFor="slug" className="mb-2 block text-xs font-medium">Project slug <span className="text-[var(--danger)]">*</span></label>
          <Input id="slug" name="slug" required minLength={2} maxLength={60} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={project.slug} className="font-mono" />
          <p className="mt-1.5 text-xs text-muted">Lowercase letters, numbers, and hyphens.</p>
        </div>
        <div>
          <label htmlFor="description" className="mb-2 block text-xs font-medium">Description <span className="font-normal text-muted">(optional)</span></label>
          <Textarea id="description" name="description" rows={4} maxLength={500} defaultValue={project.description ?? ""} />
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-5">
          <Link href={`/projects/${project.id}`} className="inline-flex h-9 items-center rounded-lg px-3.5 text-sm font-medium text-muted hover:bg-[var(--surface-raised)]">Cancel</Link>
          <SubmitButton>Save changes</SubmitButton>
        </div>
      </form>
    </main>
  );
}

function EditProjectFallback() {
  return <main aria-label="Loading project settings" className="mx-auto max-w-3xl animate-pulse px-5 py-7 sm:px-8 lg:px-10"><div className="mb-6 h-4 w-24 rounded bg-[var(--surface-raised)]" /><div className="mb-8 h-16 w-56 rounded bg-[var(--surface-raised)]" /><div className="h-72 rounded-xl border border-border bg-surface" /></main>;
}
