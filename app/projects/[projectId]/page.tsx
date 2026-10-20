import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import {
  archiveProjectAction,
  saveEnvironmentAction,
  saveRepositoryAction,
} from "../actions";
import { getProjectWorkspace } from "../../../lib/data/projects";

const environmentTypes = ["DEVELOPMENT", "STAGING", "PRODUCTION"] as const;

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
  let workspace;
  try {
    workspace = await getProjectWorkspace(userId, projectId);
  } catch {
    return (
      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:px-10">
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Project details could not be loaded. Please try again.
        </p>
      </main>
    );
  }
  if (!workspace) notFound();
  const { project, repository, environments } = workspace;

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

      {query.error?.startsWith("repository-") && (
        <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {query.error === "repository-invalid"
            ? "Enter a valid GitHub owner and repository name."
            : "The GitHub repository could not be saved. Please try again."}
        </p>
      )}

      {query.error?.startsWith("environment-") && (
        <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {query.error === "environment-invalid"
            ? "Check the environment values and try again."
            : "The environment could not be saved. Please try again."}
        </p>
      )}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">GitHub repository</h2>
            <p className="mt-1 text-sm text-slate-500">Connect the repository that ships this project.</p>
          </div>
          {repository && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Connected
            </span>
          )}
        </div>
        {repository && (
          <a href={repository.url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-medium text-indigo-700 hover:text-indigo-900">
            {repository.owner}/{repository.name} ↗
          </a>
        )}
        <form action={saveRepositoryAction} className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <input type="hidden" name="projectId" value={project.id} />
          <div>
            <label htmlFor="repository-owner" className="mb-2 block text-sm font-medium">GitHub owner</label>
            <input id="repository-owner" name="owner" required maxLength={39} defaultValue={repository?.owner ?? ""} placeholder="acme" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </div>
          <div>
            <label htmlFor="repository-name" className="mb-2 block text-sm font-medium">Repository name</label>
            <input id="repository-name" name="name" required maxLength={100} defaultValue={repository?.name ?? ""} placeholder="payments-api" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </div>
          <div className="sm:col-span-2 sm:flex sm:justify-end">
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
              {repository ? "Update repository" : "Link repository"}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Environments</h2>
          <p className="mt-1 text-sm text-slate-500">Store deployment targets and references to your secret store.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {environmentTypes.map((type) => {
            const environment = environments.find((item) => item.type === type);

            return (
              <form key={type} action={saveEnvironmentAction} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="type" value={type} />
                <div className="mb-5 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{type.toLowerCase()}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${environment ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {environment ? "Configured" : "Not configured"}
                  </span>
                </div>
                <label htmlFor={`target-${type}`} className="mb-2 block text-xs font-medium text-slate-600">Deploy target</label>
                <input id={`target-${type}`} name="deployTarget" maxLength={120} defaultValue={environment?.deployTarget ?? ""} placeholder="e.g. production-cluster" className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                <label htmlFor={`config-${type}`} className="mb-2 block text-xs font-medium text-slate-600">Secret store reference</label>
                <input id={`config-${type}`} name="configRef" maxLength={200} defaultValue={environment?.configRef ?? ""} placeholder="e.g. vault://apps/payments/prod" className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                <p className="mt-2 text-xs leading-5 text-slate-500">Reference only. Never enter a secret value here.</p>
                <button type="submit" className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Save {type.toLowerCase()}
                </button>
              </form>
            );
          })}
        </div>
      </section>

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
