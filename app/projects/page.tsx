import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { io } from "next/cache";
import { getDashboardDeployments } from "../../lib/data/deployments";
import { getProjectWorkspace } from "../../lib/data/projects";
import { ProjectExplorer, type ProjectListItem } from "../../components/projects/ProjectExplorer";
import { Card, EmptyState } from "../../components/ui/primitives";

export default function ProjectsPage(props: { searchParams: Promise<{ error?: string }> }) {
  return <Suspense fallback={<ProjectsFallback />}><ProjectsContent {...props} /></Suspense>;
}

async function ProjectsContent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const query = await searchParams;
  await io();
  let projects;
  try {
    const rows = await getDashboardDeployments(userId);
    projects = await Promise.all(rows.map(async ({ project, environments, deployments }) => {
      const workspace = await getProjectWorkspace(userId, project.id);
      const latestByEnvironment = new Map<string, (typeof deployments)[number]>();
      for (const deployment of deployments) if (!latestByEnvironment.has(deployment.environmentId)) latestByEnvironment.set(deployment.environmentId, deployment);
      const items: ProjectListItem["environments"] = environments.map((environment) => {
        const deployment = latestByEnvironment.get(environment.id);
        return { type: environment.type, deployment: deployment ? { status: deployment.status, createdAt: deployment.createdAt } : null };
      });
      return { ...project, repository: workspace?.repository ?? null, environments: items };
    }));
  } catch {
    return <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><h1 className="text-2xl font-semibold">Projects</h1><p role="alert" className="mt-6 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_9%,transparent)] p-4 text-sm text-[var(--danger)]">Projects could not be loaded. Please try again.</p></main>;
  }

  return <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:px-10">
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-accent">Workspace</p><h1 className="text-2xl font-semibold tracking-tight">Projects</h1><p className="mt-2 text-sm text-muted">Keep repositories, environments, and releases together.</p></div><Link href="/projects/new" className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)]">＋ <span className="ml-1">New project</span></Link></header>
    {query.error === "not-found" && <p role="status" className="mb-5 rounded-lg border border-[color-mix(in_srgb,var(--warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] px-4 py-3 text-sm text-[var(--warning)]">That project is unavailable or has already been archived.</p>}
    {projects.length === 0 ? <Card><EmptyState title="No projects yet" description="Create a project to start tracking deployments, environments, and releases." action={<Link href="/projects/new" className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-sm font-medium text-white">Create your first project</Link>} /></Card> : <ProjectExplorer projects={projects} />}
  </main>;
}

function ProjectsFallback() {
  return <main aria-label="Loading projects" className="mx-auto max-w-6xl animate-pulse px-5 py-7 sm:px-8 lg:px-10"><div className="mb-7 h-16 w-64 rounded-lg bg-[var(--surface-raised)]" /><div className="mb-4 h-10 rounded-lg bg-[var(--surface-raised)]" /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-48 rounded-xl border border-border bg-surface" />)}</div></main>;
}
