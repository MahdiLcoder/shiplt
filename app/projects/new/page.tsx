import Link from "next/link";
import { createProjectAction } from "../actions";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:px-10">
      <Link href="/projects" className="text-sm font-medium text-slate-500 hover:text-slate-900">
        ← Projects
      </Link>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight">Create a project</h1>
      <p className="mt-2 text-sm text-slate-500">
        Add a project to keep its releases and environments in one place.
      </p>

      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error === "invalid"
            ? "Check the project name, slug, and description, then try again."
            : "The project could not be saved. The slug may already be in use."}
        </p>
      )}

      <form action={createProjectAction} className="mt-7 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">Project name</label>
          <input
            id="name"
            name="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="Payments API"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label htmlFor="slug" className="mb-2 block text-sm font-medium">Project slug</label>
          <input
            id="slug"
            name="slug"
            required
            minLength={2}
            maxLength={60}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="payments-api"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1.5 text-xs text-slate-500">Lowercase letters, numbers, and hyphens.</p>
        </div>
        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium">Description <span className="font-normal text-slate-400">(optional)</span></label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={500}
            placeholder="What does this project do?"
            className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <Link href="/projects" className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </Link>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
            Create project
          </button>
        </div>
      </form>
    </main>
  );
}
