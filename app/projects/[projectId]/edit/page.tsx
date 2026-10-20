import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { updateProjectAction } from "../../actions";
import { getProject } from "../../../../lib/data/projects";

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  let project;
  try {
    project = await getProject(userId, projectId);
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:px-10">
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Project details could not be loaded. Please try again.
        </p>
      </main>
    );
  }
  if (!project) notFound();

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:px-10">
      <Link href={`/projects/${project.id}`} className="text-sm font-medium text-slate-500 hover:text-slate-900">
        ← {project.name}
      </Link>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight">Edit project</h1>

      {query.error && (
        <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {query.error === "invalid"
            ? "Check the project name, slug, and description, then try again."
            : "The project could not be saved. The slug may already be in use."}
        </p>
      )}

      <form action={updateProjectAction} className="mt-7 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <input type="hidden" name="projectId" value={project.id} />
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">Project name</label>
          <input id="name" name="name" required minLength={2} maxLength={80} defaultValue={project.name} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label htmlFor="slug" className="mb-2 block text-sm font-medium">Project slug</label>
          <input id="slug" name="slug" required minLength={2} maxLength={60} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={project.slug} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium">Description</label>
          <textarea id="description" name="description" rows={4} maxLength={500} defaultValue={project.description ?? ""} className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Link href={`/projects/${project.id}`} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</Link>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">Save changes</button>
        </div>
      </form>
    </main>
  );
}
