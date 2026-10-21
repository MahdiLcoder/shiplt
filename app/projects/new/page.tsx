import Link from "next/link";
import { createProjectAction } from "../actions";
import { Input, Textarea } from "../../../components/ui/primitives";
import { SubmitButton } from "../../../components/ui/SubmitButton";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-5 py-7 sm:px-8 lg:px-10">
      <Link href="/projects" className="text-sm font-medium text-muted hover:text-foreground">
        ← All projects
      </Link>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">Create a project</h1>
      <p className="mt-2 text-sm text-muted">
        Add a project to keep its releases and environments in one place.
      </p>

      {error && (
        <p role="alert" aria-live="polite" className="mt-6 rounded-lg border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_9%,transparent)] px-4 py-3 text-sm text-[var(--danger)]">
          {error === "invalid"
            ? "Check the project name, slug, and description, then try again."
            : "The project could not be saved. The slug may already be in use."}
        </p>
      )}

      <form action={createProjectAction} className="mt-7 space-y-5 rounded-xl border border-border bg-surface p-5 sm:p-7">
        <div>
          <label htmlFor="name" className="mb-2 block text-xs font-medium">Project name <span className="text-[var(--danger)]">*</span></label>
          <Input
            id="name"
            name="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="Payments API"
            aria-describedby="name-hint"
          />
          <p id="name-hint" className="mt-1.5 text-xs text-muted">A recognizable name for your service.</p>
        </div>
        <div>
          <label htmlFor="slug" className="mb-2 block text-xs font-medium">Project slug <span className="text-[var(--danger)]">*</span></label>
          <Input
            id="slug"
            name="slug"
            required
            minLength={2}
            maxLength={60}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="payments-api"
            className="font-mono"
          />
          <p className="mt-1.5 text-xs text-muted">Lowercase letters, numbers, and hyphens. Used in deployment event names.</p>
        </div>
        <div>
          <label htmlFor="description" className="mb-2 block text-xs font-medium">Description <span className="font-normal text-muted">(optional)</span></label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            maxLength={500}
            placeholder="What does this project do?"
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-5">
          <Link href="/projects" className="inline-flex h-9 items-center rounded-lg px-3.5 text-sm font-medium text-muted hover:bg-[var(--surface-raised)]">
            Cancel
          </Link>
          <SubmitButton>Create project</SubmitButton>
        </div>
      </form>
    </main>
  );
}
