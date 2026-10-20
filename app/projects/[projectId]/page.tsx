import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { archiveProjectAction } from "../actions";
import { getProject } from "../../../lib/data/projects";

export default async function ProjectPage({
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
      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:px-10">
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Project details could not be loaded. Please try again.
        </p>
      </main>
    );
  }
  if (!project) notFound();

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:px-10">
      <Link href="/projects" className="text-sm font-medium text-slate-500 hover:text-slate-900">
        ← Projects
      </Link>
      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-xs text-slate-500">{project.slug}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {project.description || "No description added."}
          </p>
        </div>
        <Link
          href={`/projects/${project.id}/edit`}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Edit project
        </Link>
      </header>

      {query.error === "save" && (
        <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          The project could not be archived. Please try again.
        </p>
      )}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Project settings</h2>
        <p className="mt-1 text-sm text-slate-500">Archive this project to remove it from your active list.</p>
        <form action={archiveProjectAction} className="mt-5 border-t border-slate-100 pt-5">
          <input type="hidden" name="projectId" value={project.id} />
          <button
            type="submit"
            className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            Archive project
          </button>
        </form>
      </section>
    </main>
  );
}
