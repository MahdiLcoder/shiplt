import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { io } from "next/cache";
import { getDashboardDeployments } from "../../../lib/data/deployments";
import { Card, EmptyState, StatusBadge } from "../../../components/ui/primitives";

export default function ActivityPage() {
  return <Suspense fallback={<ActivityFallback />}><ActivityContent /></Suspense>;
}

async function ActivityContent() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  await io();
  let deployments;
  try {
    const projects = await getDashboardDeployments(userId);
    deployments = projects.flatMap(({ project, environments, deployments: recentDeployments }) => recentDeployments.map((deployment) => ({
      project,
      environment: environments.find((item) => item.id === deployment.environmentId),
      deployment,
    }))).sort((a, b) => Date.parse(b.deployment.createdAt) - Date.parse(a.deployment.createdAt));
  } catch {
    return <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8"><h1 className="text-2xl font-semibold tracking-tight">Activity</h1><p role="alert" className="mt-6 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_9%,transparent)] p-4 text-sm text-[var(--danger)]">Deployment activity could not be loaded. Please try again.</p></main>;
  }

  return <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
    <header className="mb-7"><p className="mb-2 text-xs font-medium text-accent">WORKSPACE</p><h1 className="text-2xl font-semibold tracking-tight">Activity</h1><p className="mt-2 text-sm text-muted">Deployment updates across all your projects.</p></header>
    <Card>{deployments.length === 0 ? <EmptyState title="No activity yet" description="Deployment events will appear here as your projects ship updates." action={<Link href="/projects/new" className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-sm font-medium text-white">Create a project</Link>} /> : <><ul className="divide-y divide-border">{deployments.map(({ project, environment, deployment }) => <li key={deployment.id} className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5"><span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-lg text-sm ${deployment.status === "SUCCEEDED" ? "bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]" : deployment.status === "FAILED" ? "bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]" : "bg-[var(--surface-raised)] text-muted"}`}>{deployment.status === "SUCCEEDED" ? "✓" : deployment.status === "FAILED" ? "×" : "◷"}</span><div className="min-w-[140px] flex-1"><Link className="text-sm font-medium hover:text-accent" href={`/projects/${project.id}`}>{project.name}</Link><p className="mt-1 text-xs text-muted">{environment?.type ?? "Environment"} <span aria-hidden="true">·</span> <code className="font-mono">{deployment.commitSha.slice(0, 8)}</code>{deployment.rollbackOfId ? " · Rollback" : ""}</p></div><StatusBadge status={deployment.status as "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED"} /><time className="w-full text-xs text-muted sm:w-auto" dateTime={deployment.createdAt} title={new Date(deployment.createdAt).toLocaleString()}>{relativeTime(deployment.createdAt)}</time></li>)}</ul><p className="border-t border-border px-4 py-3 text-[11px] text-muted sm:px-5">Showing the latest 8 deployments per project.</p></>}</Card>
  </main>;
}

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

function ActivityFallback() {
  return <main aria-label="Loading activity" className="mx-auto max-w-5xl animate-pulse px-5 py-8 sm:px-8"><div className="mb-7 h-16 w-64 rounded-lg bg-[var(--surface-raised)]" /><div className="h-96 rounded-xl border border-border bg-surface" /></main>;
}
