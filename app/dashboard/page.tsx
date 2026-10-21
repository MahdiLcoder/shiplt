import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { io } from "next/cache";
import type { DeploymentStatus } from "../generated/prisma/enums";
import { getDashboardDeployments } from "../../lib/data/deployments";
import { Card, EmptyState, Skeleton, StatusBadge } from "../../components/ui/primitives";

const environmentOrder = ["DEVELOPMENT", "STAGING", "PRODUCTION"] as const;
type EnvironmentType = (typeof environmentOrder)[number];

export default function DashboardPage() {
  return <Suspense fallback={<DashboardFallback />}><DashboardContent /></Suspense>;
}

async function DashboardContent() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await io();
  let projects;
  try {
    projects = await getDashboardDeployments(userId);
  } catch {
    return <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8"><h1 className="text-2xl font-semibold">Dashboard</h1><p role="alert" className="mt-6 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_9%,transparent)] p-4 text-sm text-[var(--danger)]">Deployment activity could not be loaded. Please try again.</p></main>;
  }

  const all = projects.flatMap(({ project, environments, deployments }) => deployments.map((deployment) => ({ project, environment: environments.find((item) => item.id === deployment.environmentId), deployment })));
  const latest = new Map<string, (typeof all)[number]>();
  const latestGood = new Map<string, (typeof all)[number]>();
  for (const item of all) {
    const key = `${item.project.id}:${item.deployment.environmentId}`;
    if (!latest.has(key)) latest.set(key, item);
    if (item.deployment.status === "SUCCEEDED" && !latestGood.has(key)) latestGood.set(key, item);
  }
  const weekAgo = startOfWindow();
  const recent = all.filter(({ deployment }) => Date.parse(deployment.createdAt) >= weekAgo);
  const successful = recent.filter(({ deployment }) => deployment.status === "SUCCEEDED").length;
  const successRate = recent.length ? `${Math.round(successful / recent.length * 100)}%` : "—";
  const failing = [...latest.values()].filter(({ deployment }) => deployment.status === "FAILED").length;

  return <main className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 lg:px-10">
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-accent">Workspace</p><h1 className="text-2xl font-semibold tracking-tight">Deployment overview</h1><p className="mt-2 text-sm text-muted">From commit to deployment, all in one place.</p></div><Link href="/projects/new" className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)]">＋ <span className="ml-1">Create project</span></Link></header>
    {projects.length === 0 ? <Card><EmptyState title="Your workspace is ready" description="Create your first project to see environments, deployment health, and recent releases together." action={<Link href="/projects/new" className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-sm font-medium text-white">Create your first project</Link>} /></Card> : <>
      <section aria-label="Workspace summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Projects" value={String(projects.length)} detail="Active in this workspace" icon="◇" />
        <SummaryCard label="Deployments · 7 days" value={String(recent.length)} detail="Across all environments" icon="↗" />
        <SummaryCard label="Success rate" value={successRate} detail="Over the last 7 days" icon="✓" accent="success" />
        <SummaryCard label="Currently failing" value={String(failing)} detail={failing ? "Latest environment status" : "All environments clear"} icon="!" accent={failing ? "danger" : "success"} />
      </section>

      <section className="mt-8"><div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-base font-semibold">Environments at a glance</h2><p className="mt-1 text-xs text-muted">Latest deployment health by project and environment.</p></div><Link href="/projects" className="text-xs font-medium text-accent hover:underline">All projects →</Link></div>
        <div className="space-y-3">{projects.map(({ project, environments }) => <Card key={project.id} className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5"><div className="flex min-w-0 items-center gap-2"><span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--surface-raised)] text-xs">◈</span><Link href={`/projects/${project.id}`} className="truncate text-sm font-semibold hover:text-accent">{project.name}</Link><code className="hidden truncate font-mono text-[10px] text-muted sm:inline">{project.slug}</code></div><Link href={`/projects/${project.id}`} className="text-xs text-muted hover:text-foreground">View project ↗</Link></div><div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">{environmentOrder.map((type) => {
          const environment = environments.find((item) => item.type === type);
          const item = environment ? latest.get(`${project.id}:${environment.id}`) : undefined;
          const good = environment ? latestGood.get(`${project.id}:${environment.id}`) : undefined;
          return <EnvironmentTile key={type} type={type} item={item} good={good} />;
        })}</div></Card>)}</div>
      </section>

      <section id="recent-activity" className="mt-8"><div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-base font-semibold">Recent activity</h2><p className="mt-1 text-xs text-muted">The latest deployment events across your projects.</p></div><Link href="/dashboard/activity" className="text-xs font-medium text-accent hover:underline">View activity →</Link></div>
        <Card>{all.length === 0 ? <EmptyState title="No deployments reported" description="Once your deployment sender posts an event, the release will appear here." /> : <ul className="divide-y divide-border">{all.slice(0, 8).map(({ project, environment, deployment }) => <li key={deployment.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5"><StatusMark status={deployment.status} /><div className="min-w-[150px] flex-1"><div className="flex flex-wrap items-center gap-2"><Link href={`/projects/${project.id}`} className="text-sm font-medium hover:text-accent">{project.name}</Link><span className="text-muted">/</span><span className="text-xs text-muted">{humanEnvironment(environment?.type)}</span>{deployment.rollbackOfId && <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted">Rollback</span>}</div><p className="mt-1 truncate font-mono text-[11px] text-muted">{deployment.imageRef || "Image unavailable"} <span className="mx-1 font-sans">·</span>{deployment.commitSha.slice(0, 8)}</p></div><StatusBadge status={deployment.status as DeploymentStatus} /><time className="w-full text-[11px] text-muted sm:w-auto" dateTime={deployment.createdAt} title={new Date(deployment.createdAt).toLocaleString()}>{relativeTime(deployment.createdAt)}</time></li>)}</ul>}</Card>
      </section>
    </>}
  </main>;
}

function SummaryCard({ label, value, detail, icon, accent = "default" }: { label: string; value: string; detail: string; icon: string; accent?: "default" | "success" | "danger" }) {
  const color = accent === "success" ? "text-[var(--success)]" : accent === "danger" ? "text-[var(--danger)]" : "text-accent";
  return <Card className="p-4 sm:p-5"><div className="flex items-center justify-between"><p className="text-xs font-medium text-muted">{label}</p><span aria-hidden="true" className={`text-sm ${color}`}>{icon}</span></div><p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 truncate text-[11px] text-muted">{detail}</p></Card>;
}

function EnvironmentTile({ type, item, good }: { type: EnvironmentType; item: { deployment: { status: DeploymentStatus; imageRef: string; commitSha: string; createdAt: string } } | undefined; good: { deployment: { imageRef: string; commitSha: string } } | undefined }) {
  const display = item?.deployment ?? good?.deployment;
  const health = !item ? "Unknown" : item.deployment.status === "SUCCEEDED" ? "Healthy" : item.deployment.status === "FAILED" ? "Down" : "Degraded";
  const healthColor = health === "Healthy" ? "bg-[var(--success)]" : health === "Down" ? "bg-[var(--danger)]" : health === "Degraded" ? "bg-[var(--warning)]" : "bg-muted";
  return <div className="min-w-0 px-4 py-4 sm:px-5"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className={`size-2 rounded-full ${healthColor}`} /><h3 className="text-xs font-semibold">{humanEnvironment(type)}</h3><span className="text-[11px] text-muted">{health}</span></div>{item && <StatusBadge status={item.deployment.status} />}</div>{display ? <><p className="mt-4 truncate font-mono text-xs" title={display.imageRef}>{imageTag(display.imageRef)}</p><div className="mt-2 flex items-center justify-between gap-2"><code className="font-mono text-[10px] text-muted" title={display.commitSha}>{display.commitSha.slice(0, 8)}</code>{item && <time className="text-[10px] text-muted" dateTime={item.deployment.createdAt} title={new Date(item.deployment.createdAt).toLocaleString()}>{relativeTime(item.deployment.createdAt)}</time>}</div>{good && item?.deployment.status === "FAILED" && <p className="mt-2 text-[10px] font-medium text-[var(--success)]">Last good: {imageTag(good.deployment.imageRef)}</p>}</> : <p className="mt-4 text-xs text-muted">No deployment yet</p>}</div>;
}

function StatusMark({ status }: { status: DeploymentStatus }) {
  const symbol = status === "SUCCEEDED" ? "✓" : status === "FAILED" ? "×" : status === "RUNNING" ? "◌" : status === "CANCELLED" ? "⊘" : "◷";
  const color = status === "SUCCEEDED" ? "text-[var(--success)]" : status === "FAILED" ? "text-[var(--danger)]" : status === "RUNNING" ? "text-[var(--info)]" : status === "CANCELLED" ? "text-[var(--warning)]" : "text-muted";
  return <span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-raised)] text-sm ${color}`}>{symbol}</span>;
}

function humanEnvironment(value?: string) {
  return value === "DEVELOPMENT" ? "Development" : value === "STAGING" ? "Staging" : value === "PRODUCTION" ? "Production" : "Environment";
}
function imageTag(value: string) { return value.split("/").at(-1) ?? value; }
function startOfWindow() { return Date.now() - 7 * 24 * 60 * 60 * 1000; }
function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

function DashboardFallback() {
  return <main aria-label="Loading dashboard" className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 lg:px-10"><div className="mb-7"><Skeleton className="h-7 w-56" /><Skeleton className="mt-3 h-4 w-72" /></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28 rounded-xl" />)}</div><Skeleton className="mt-8 h-72 rounded-xl" /><Skeleton className="mt-8 h-64 rounded-xl" /></main>;
}
