import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { listProjects } from "../../lib/data/projects";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const query = await searchParams;
  let projects;
  try {
    projects = await listProjects(userId);
  } catch {
    return (
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Projects could not be loaded. Please try again.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-indigo-700">Workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-2 text-sm text-slate-500">
            Keep repositories, environments, and releases together.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          New project
        </Link>
      </header>

      {query.error === "not-found" && (
        <p role="status" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          That project is unavailable or has already been archived.
        </p>
      )}

      {projects.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <h2 className="text-lg font-semibold">No projects yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Create a project to start tracking deployments.
          </p>
          <Link
            href="/projects/new"
            className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Create your first project
          </Link>
        </section>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">{project.name}</h2>
                    <p className="mt-1 truncate font-mono text-xs text-slate-500">{project.slug}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    Project
                  </span>
                </div>
                <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                  {project.description || "No description added."}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
