"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DeploymentStatus } from "../../app/generated/prisma/enums";
import { Input } from "../ui/primitives";

type Environment = { type: string; deployment: { status: DeploymentStatus; createdAt: string } | null };
export type ProjectListItem = { id: string; name: string; slug: string; description: string | null; createdAt: string; repository: { name: string; owner: string; url: string } | null; environments: Environment[] };

type HealthFilter = "all" | "failing" | "healthy" | "unknown";

export function ProjectExplorer({ projects }: { projects: ProjectListItem[] }) {
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState<HealthFilter>("all");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [view, setView] = useState<"grid" | "table">("grid");
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return projects.filter((project) => {
      const textMatch = !value || `${project.name} ${project.slug} ${project.description ?? ""}`.toLowerCase().includes(value);
      const failed = project.environments.some((environment) => environment.deployment?.status === "FAILED");
      const deployed = project.environments.some((environment) => environment.deployment);
      const healthMatch = health === "all" || (health === "failing" && failed) || (health === "healthy" && deployed && !failed) || (health === "unknown" && !deployed);
      return textMatch && healthMatch;
    }).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [projects, query, health, sort]);

  return <>
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="min-w-0 flex-1"><span className="sr-only">Search projects</span><Input type="search" placeholder="Search projects…" value={query} onChange={(event) => setQuery(event.currentTarget.value)} /></label>
      <div className="flex gap-2"><label className="sr-only" htmlFor="project-health">Filter project health</label><select id="project-health" value={health} onChange={(event) => setHealth(event.currentTarget.value as HealthFilter)} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"><option value="all">All health</option><option value="failing">Failing</option><option value="healthy">Healthy</option><option value="unknown">No deployments</option></select><label className="sr-only" htmlFor="project-sort">Sort projects</label><select id="project-sort" value={sort} onChange={(event) => setSort(event.currentTarget.value as "recent" | "name")} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"><option value="recent">Recently added</option><option value="name">Name A–Z</option></select><div className="hidden items-center rounded-lg border border-border p-0.5 sm:flex" role="group" aria-label="Project display"><button type="button" onClick={() => setView("grid")} aria-pressed={view === "grid"} aria-label="Grid view" className={`grid size-8 place-items-center rounded-md text-sm ${view === "grid" ? "bg-[var(--surface-raised)] text-foreground" : "text-muted"}`}>▦</button><button type="button" onClick={() => setView("table")} aria-pressed={view === "table"} aria-label="Table view" className={`grid size-8 place-items-center rounded-md text-sm ${view === "table" ? "bg-[var(--surface-raised)] text-foreground" : "text-muted"}`}>☷</button></div></div>
    </div>
    {filtered.length === 0 ? <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center"><h2 className="text-sm font-semibold">No matching projects</h2><p className="mt-2 text-sm text-muted">Try another search or health filter.</p></div> : <>
      <ul className={`grid gap-3 ${view === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : ""}`}>{filtered.map((project) => <li key={project.id} className={view === "table" ? "md:hidden" : ""}><ProjectCard project={project} /></li>)}</ul>
      {view === "table" && <div className="hidden overflow-x-auto rounded-xl border border-border md:block"><table className="w-full text-left text-sm"><thead className="bg-[var(--surface-raised)] text-[11px] uppercase tracking-wide text-muted"><tr><th className="px-4 py-3">Project</th><th className="px-4 py-3">Environments</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Health</th></tr></thead><tbody className="divide-y divide-border">{filtered.map((project) => <tr key={project.id} className="hover:bg-[var(--surface-raised)]"><td className="px-4 py-3"><Link href={`/projects/${project.id}`} className="font-medium hover:text-accent">{project.name}</Link><p className="mt-0.5 font-mono text-[11px] text-muted">{project.slug}</p></td><td className="px-4 py-3"><EnvironmentDots environments={project.environments} /></td><td className="px-4 py-3 text-xs text-muted"><time dateTime={project.createdAt} title={new Date(project.createdAt).toLocaleString()}>{relativeTime(project.createdAt)}</time></td><td className="px-4 py-3"><HealthLabel environments={project.environments} /></td></tr>)}</tbody></table></div>}
    </>}
  </>;
}

function ProjectCard({ project }: { project: ProjectListItem }) {
  return <article className="group rounded-xl border border-border bg-surface p-4 transition hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] hover:bg-[var(--surface-raised)]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/projects/${project.id}`} className="block truncate text-sm font-semibold hover:text-accent">{project.name}</Link><p className="mt-1 truncate font-mono text-[11px] text-muted">{project.slug}</p></div><span className="rounded-md border border-border px-2 py-1 text-[10px] text-muted">Active</span></div><p className="mt-4 min-h-10 line-clamp-2 text-xs leading-5 text-muted">{project.description || "No description added."}</p><div className="mt-3 min-h-4 text-[11px]">{project.repository ? <a href={project.repository.url} target="_blank" rel="noreferrer" className="text-muted hover:text-accent">⌘ {project.repository.owner}/{project.repository.name} ↗</a> : <span className="text-muted">Repository not connected</span>}</div><div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3"><EnvironmentDots environments={project.environments} /><span className="truncate text-[10px] text-muted">{project.environments.some((environment) => environment.deployment) ? `Updated ${latestTime(project.environments)}` : "No deployments yet"}</span></div></article>;
}

function EnvironmentDots({ environments }: { environments: Environment[] }) {
  const names = ["DEVELOPMENT", "STAGING", "PRODUCTION"] as const;
  return <div className="flex flex-wrap gap-2" aria-label="Environment health">{names.map((name) => {
    const environment = environments.find((item) => item.type === name);
    const status = environment?.deployment?.status;
    const label = status === "SUCCEEDED" ? "Healthy" : status === "FAILED" ? "Down" : status ? "Degraded" : "Unknown";
    const color = status === "SUCCEEDED" ? "bg-[var(--success)]" : status === "FAILED" ? "bg-[var(--danger)]" : status ? "bg-[var(--warning)]" : "bg-muted";
    return <span key={name} className="inline-flex items-center gap-1 text-[10px] text-muted" title={`${name.toLowerCase()}: ${label}`}><span className={`size-1.5 rounded-full ${color}`} /><span className="sr-only">{name.toLowerCase()} {label}</span><span aria-hidden="true">{name === "DEVELOPMENT" ? "Dev" : name === "STAGING" ? "Stage" : "Prod"}</span></span>;
  })}</div>;
}

function HealthLabel({ environments }: { environments: Environment[] }) {
  const values = environments.map((item) => item.deployment?.status);
  const label = values.includes("FAILED") ? "Failing" : values.includes("SUCCEEDED") ? "Healthy" : values.some(Boolean) ? "Deploying" : "Unknown";
  const color = label === "Healthy" ? "text-[var(--success)]" : label === "Failing" ? "text-[var(--danger)]" : label === "Deploying" ? "text-[var(--warning)]" : "text-muted";
  return <span className={`inline-flex items-center gap-1.5 text-xs ${color}`}><span aria-hidden="true">{label === "Healthy" ? "✓" : label === "Failing" ? "×" : label === "Deploying" ? "◌" : "◷"}</span>{label}</span>;
}

function latestTime(environments: Environment[]) {
  const dates = environments.flatMap((item) => item.deployment ? [item.deployment.createdAt] : []).sort((a, b) => Date.parse(b) - Date.parse(a));
  return dates[0] ? relativeTime(dates[0]) : "—";
}
function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} hr ago` : `${Math.floor(hours / 24)} days ago`;
}
