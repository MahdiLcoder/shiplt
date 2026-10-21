import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { io } from "next/cache";
import type { DeploymentStatus, EnvironmentType } from "../../generated/prisma/enums";
import { archiveProjectAction, saveEnvironmentAction, saveRepositoryAction } from "../actions";
import { getProjectWorkspace } from "../../../lib/data/projects";
import { listProjectAuditLogs, listProjectDeployments } from "../../../lib/data/deployments";
import { Card, EmptyState, Input, StatusBadge } from "../../../components/ui/primitives";
import { SubmitButton } from "../../../components/ui/SubmitButton";
import { CopyButton } from "../../../components/ui/CopyButton";
import { ConfirmAction } from "../../../components/ui/ConfirmAction";

const environmentOrder: EnvironmentType[] = ["DEVELOPMENT", "STAGING", "PRODUCTION"];
const tabs = ["overview", "deployments", "environments", "settings", "audit"] as const;
type ProjectTab = (typeof tabs)[number];

type ProjectPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string; rollback?: string; tab?: string; environment?: string; status?: string }>;
};

export default function ProjectPage(props: ProjectPageProps) {
  return <Suspense fallback={<ProjectFallback />}><ProjectContent {...props} /></Suspense>;
}

async function ProjectContent({ params, searchParams }: ProjectPageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  await io();
  let workspace;
  let deployments;
  let auditLogs;
  try {
    [workspace, deployments, auditLogs] = await Promise.all([
      getProjectWorkspace(userId, projectId),
      listProjectDeployments(userId, projectId),
      listProjectAuditLogs(userId, projectId),
    ]);
  } catch {
    return <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8"><p role="alert" className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_9%,transparent)] p-4 text-sm text-[var(--danger)]">Project details could not be loaded. Please try again.</p></main>;
  }
  if (!workspace || !deployments || !auditLogs) notFound();

  const tab: ProjectTab = tabs.includes(query.tab as ProjectTab) ? query.tab as ProjectTab : "overview";
  const { project, repository, environments } = workspace;
  const environmentFilter = environmentOrder.includes(query.environment as EnvironmentType) ? query.environment as EnvironmentType : undefined;
  const statusFilter = ["PENDING", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED"].includes(query.status ?? "") ? query.status as DeploymentStatus : undefined;
  const filteredDeployments = deployments.filter((item) => (!environmentFilter || item.environment?.type === environmentFilter) && (!statusFilter || item.status === statusFilter));

  return <main className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 lg:px-10">
    <Link href="/projects" className="text-xs font-medium text-muted hover:text-foreground">← Projects</Link>
    <header className="mt-4 flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="mb-2 truncate font-mono text-[11px] text-muted">{project.slug}</p><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>{repository && <a href={repository.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent"><span aria-hidden="true">⌘</span>{repository.owner}/{repository.name} ↗</a>}</div><p className="mt-2 max-w-2xl text-sm text-muted">{project.description || "No description added."}</p></div><div className="flex items-center gap-2"><Link href={`/projects/${project.id}/edit`} className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3.5 text-sm font-medium hover:bg-[var(--surface-raised)]">Edit project</Link><details className="relative"><summary aria-label="Project actions" className="grid size-9 cursor-pointer list-none place-items-center rounded-lg border border-border text-muted hover:bg-[var(--surface-raised)]">···</summary><div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-border bg-surface p-3 shadow-xl"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">Project actions</p><ConfirmAction action={archiveProjectAction} fields={{ projectId: project.id }} trigger="Archive project" title="Archive this project?" description={`${project.name} will be removed from your active project list. Its deployment history remains available.`} confirmLabel="Archive project" danger /></div></details></div></header>

    {query.rollback === "recorded" && <Notice tone="success">Rollback record created. It is awaiting execution by your deployment system.</Notice>}
    {query.error && <Notice tone={query.error.startsWith("rollback") || query.error === "save" ? "danger" : "warning"}>{errorMessage(query.error)}</Notice>}

    <nav aria-label="Project sections" className="mt-7 flex gap-1 overflow-x-auto border-b border-border">{tabs.map((item) => <Link key={item} href={`/projects/${project.id}?tab=${item}`} aria-current={tab === item ? "page" : undefined} className={`shrink-0 border-b-2 px-3 py-2.5 text-xs font-medium capitalize transition ${tab === item ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"}`}>{item === "audit" ? "Audit log" : item}</Link>)}</nav>

    {tab === "overview" && <Overview projectId={project.id} environments={environments} deployments={deployments} />}
    {tab === "deployments" && <DeploymentsPanel projectId={project.id} deployments={filteredDeployments} environment={query.environment ?? ""} status={query.status ?? ""} />}
    {tab === "environments" && <EnvironmentsPanel projectId={project.id} environments={environments} deployments={deployments} />}
    {tab === "settings" && <SettingsPanel projectId={project.id} projectName={project.name} repository={repository} />}
    {tab === "audit" && <AuditPanel entries={auditLogs} ownerId={userId} />}
  </main>;
}

function Overview({ projectId, environments, deployments }: { projectId: string; environments: { id: string; type: EnvironmentType; deployTarget: string | null }[]; deployments: NonNullable<Awaited<ReturnType<typeof listProjectDeployments>>> }) {
  return <div className="pt-6"><section><div className="mb-4"><h2 className="text-base font-semibold">Environment releases</h2><p className="mt-1 text-xs text-muted">Current health and most recent successful release per environment.</p></div><div className="grid gap-3 lg:grid-cols-3">{environmentOrder.map((type) => {
    const environment = environments.find((item) => item.type === type);
    const history = environment ? deployments.filter((item) => item.environmentId === environment.id) : [];
    const latest = history[0];
    const good = history.find((item) => item.status === "SUCCEEDED");
    const health = latest?.status === "SUCCEEDED" ? "Healthy" : latest?.status === "FAILED" ? "Down" : latest ? "Degraded" : "Unknown";
    return <Card key={type} className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted">{environmentName(type)}</p><h3 className="mt-1 text-sm font-semibold">{health}</h3></div><StatusIcon status={latest?.status} /></div>{latest ? <div className="mt-4 border-t border-border pt-3"><div className="flex items-center justify-between gap-2"><StatusBadge status={latest.status} /><time className="text-[10px] text-muted" dateTime={latest.createdAt} title={new Date(latest.createdAt).toLocaleString()}>{relativeTime(latest.createdAt)}</time></div><p className="mt-3 truncate font-mono text-xs" title={latest.imageRef}>{latest.imageRef}</p><p className="mt-1 font-mono text-[10px] text-muted">{latest.commitSha.slice(0, 8)}</p>{good && <div className="mt-3 rounded-lg border border-[color-mix(in_srgb,var(--success)_24%,transparent)] bg-[color-mix(in_srgb,var(--success)_8%,transparent)] px-2.5 py-2"><p className="text-[10px] font-semibold text-[var(--success)]">Last good release</p><p className="mt-1 truncate font-mono text-[10px] text-muted" title={good.imageRef}>{good.imageRef}</p></div>}</div> : <p className="mt-4 border-t border-border pt-3 text-xs text-muted">No deployment reported yet.</p>}</Card>;
  })}</div></section><section className="mt-8"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold">Recent deployments</h2><p className="mt-1 text-xs text-muted">The latest releases for this project.</p></div><Link href={`/projects/${projectId}?tab=deployments`} className="text-xs font-medium text-accent hover:underline">All deployments →</Link></div><Card>{deployments.length ? <ul className="divide-y divide-border">{deployments.slice(0, 5).map((item) => <DeploymentSummary key={item.id} item={item} projectId={projectId} />)}</ul> : <EmptyState title="No deployments yet" description="Events from your deployment pipeline will show up here." />}</Card></section></div>;
}

function DeploymentsPanel({ projectId, deployments, environment, status }: { projectId: string; deployments: NonNullable<Awaited<ReturnType<typeof listProjectDeployments>>>; environment: string; status: string }) {
  return <section className="pt-6"><header className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-base font-semibold">Deployments</h2><p className="mt-1 text-xs text-muted">Select a release to inspect its event timeline.</p></div><form method="get" className="flex flex-wrap gap-2"><input type="hidden" name="tab" value="deployments" /><label className="sr-only" htmlFor="environment-filter">Filter environment</label><select id="environment-filter" name="environment" defaultValue={environment} className="h-9 rounded-lg border border-border bg-surface px-2.5 text-xs"><option value="">All environments</option>{environmentOrder.map((item) => <option key={item} value={item}>{environmentName(item)}</option>)}</select><label className="sr-only" htmlFor="status-filter">Filter status</label><select id="status-filter" name="status" defaultValue={status} className="h-9 rounded-lg border border-border bg-surface px-2.5 text-xs"><option value="">All statuses</option>{["PENDING", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED"].map((item) => <option key={item} value={item}>{item}</option>)}</select><button className="h-9 rounded-lg border border-border px-3 text-xs font-medium hover:bg-[var(--surface-raised)]">Filter</button></form></header><Card className="overflow-hidden">{deployments.length ? <><ul className="divide-y divide-border md:hidden">{deployments.map((item) => <li key={item.id}><DeploymentCard item={item} projectId={projectId} /></li>)}</ul><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[980px] text-left text-xs"><thead className="bg-[var(--surface-raised)] text-[10px] uppercase tracking-wide text-muted"><tr>{["Status", "Environment", "Commit", "Image", "Duration", "Started", "Triggered by"].map((label) => <th key={label} className="px-3 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{deployments.map((item) => { const href = `/projects/${projectId}/deployments/${item.id}`; return <tr key={item.id} className="transition hover:bg-[var(--surface-raised)]"><td className="px-3 py-3"><Link href={href}><StatusBadge status={item.status} /></Link></td><td className="px-3 py-3"><Link href={href}>{environmentName(item.environment?.type)}</Link></td><td className="px-3 py-3"><span className="inline-flex items-center gap-1"><Link href={href} className="font-mono hover:text-accent" title={item.commitSha}>{item.commitSha.slice(0, 8)}</Link><CopyButton value={item.commitSha} /></span></td><td className="max-w-52 truncate px-3 py-3 font-mono text-muted" title={item.imageRef}><Link href={href}>{item.imageRef}</Link></td><td className="px-3 py-3 text-muted"><Link href={href}>{duration(item.startedAt, item.finishedAt)}</Link></td><td className="px-3 py-3 text-muted"><Link href={href}><time dateTime={item.startedAt ?? item.createdAt} title={new Date(item.startedAt ?? item.createdAt).toLocaleString()}>{relativeTime(item.startedAt ?? item.createdAt)}</time></Link></td><td className="px-3 py-3 text-muted"><Link href={href}>Deployment system</Link></td></tr>; })}</tbody></table></div></> : <EmptyState title="No deployments match these filters" description="Adjust the environment or status filter to see other releases." />}</Card></section>;
}

function DeploymentCard({ item, projectId }: { item: NonNullable<Awaited<ReturnType<typeof listProjectDeployments>>>[number]; projectId: string }) {
  const href = `/projects/${projectId}/deployments/${item.id}`;
  return <article className="p-4 hover:bg-[var(--surface-raised)]"><Link href={href} className="flex items-center justify-between gap-2"><StatusBadge status={item.status} /><span className="text-[11px] text-muted">{environmentName(item.environment?.type)}</span></Link><div className="mt-3 flex items-center justify-between gap-2"><Link href={href} className="font-mono text-xs hover:text-accent" title={item.commitSha}>{item.commitSha.slice(0, 8)}</Link><CopyButton value={item.commitSha} /></div><Link href={href} className="mt-2 block truncate font-mono text-[10px] text-muted" title={item.imageRef}>{item.imageRef}</Link><div className="mt-3 flex justify-between gap-2 text-[10px] text-muted"><Link href={href}>{duration(item.startedAt, item.finishedAt)}</Link><Link href={href}><time dateTime={item.startedAt ?? item.createdAt} title={new Date(item.startedAt ?? item.createdAt).toLocaleString()}>{relativeTime(item.startedAt ?? item.createdAt)}</time></Link></div></article>;
}

function EnvironmentsPanel({ projectId, environments, deployments }: { projectId: string; environments: { id: string; type: EnvironmentType; deployTarget: string | null; configRef: string | null }[]; deployments: NonNullable<Awaited<ReturnType<typeof listProjectDeployments>>> }) {
  return <section className="pt-6"><header className="mb-4"><h2 className="text-base font-semibold">Environments</h2><p className="mt-1 text-xs text-muted">Configure targets and references to your secret store.</p></header><div className="grid gap-3 lg:grid-cols-3">{environmentOrder.map((type) => {
    const environment = environments.find((item) => item.type === type);
    const latest = environment ? deployments.find((item) => item.environmentId === environment.id) : undefined;
    return <form key={type} action={saveEnvironmentAction} className="rounded-xl border border-border bg-surface p-4"><input type="hidden" name="projectId" value={projectId} /><input type="hidden" name="type" value={type} /><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold">{environmentName(type)}</h3>{latest ? <StatusBadge status={latest.status} /> : <span className="text-[10px] text-muted">No releases yet</span>}</div><label htmlFor={`target-${type}`} className="mb-1.5 block text-[11px] font-medium">Deploy target</label><Input id={`target-${type}`} name="deployTarget" maxLength={120} defaultValue={environment?.deployTarget ?? ""} placeholder="e.g. production-cluster" /><label htmlFor={`config-${type}`} className="mb-1.5 mt-4 block text-[11px] font-medium">Secret store reference</label><Input id={`config-${type}`} name="configRef" maxLength={200} defaultValue={environment?.configRef ?? ""} placeholder="vault://apps/payments/prod" className="font-mono text-xs" /><p className="mt-2 text-[10px] text-muted">Secrets are never stored here, only references.</p><SubmitButton className="mt-4 w-full bg-surface text-foreground ring-1 ring-border hover:bg-[var(--surface-raised)]">Save environment</SubmitButton></form>;
  })}</div></section>;
}

function SettingsPanel({ projectId, projectName, repository }: { projectId: string; projectName: string; repository: { owner: string; name: string } | null }) {
  return <section className="grid gap-4 pt-6 lg:grid-cols-2"><Card className="p-5"><h2 className="text-sm font-semibold">GitHub repository</h2><p className="mt-1 text-xs text-muted">Link the repository used by this deployment project.</p>{repository && <p className="mt-4 rounded-lg bg-[var(--surface-raised)] px-3 py-2 text-xs font-mono">{repository.owner}/{repository.name}</p>}<form action={saveRepositoryAction} className="mt-4 space-y-3"><input type="hidden" name="projectId" value={projectId} /><div><label htmlFor="repository-owner" className="mb-1.5 block text-[11px] font-medium">Owner</label><Input id="repository-owner" name="owner" required maxLength={39} defaultValue={repository?.owner ?? ""} placeholder="acme" /></div><div><label htmlFor="repository-name" className="mb-1.5 block text-[11px] font-medium">Repository</label><Input id="repository-name" name="name" required maxLength={100} defaultValue={repository?.name ?? ""} placeholder="payments-api" /></div><div className="flex justify-end"><SubmitButton>{repository ? "Update repository" : "Link repository"}</SubmitButton></div></form></Card><Card className="p-5"><h2 className="text-sm font-semibold">Archive project</h2><p className="mt-1 text-xs leading-5 text-muted">Remove <span className="font-medium text-foreground">{projectName}</span> from the active project list. This keeps the existing deployment history intact.</p><div className="mt-5"><ConfirmAction action={archiveProjectAction} fields={{ projectId }} trigger="Archive project" title="Archive this project?" description={`${projectName} will be removed from your active project list. Its deployment history remains available.`} confirmLabel="Archive project" danger /></div></Card></section>;
}

function AuditPanel({ entries, ownerId }: { entries: { id: string; actorId: string; action: string; entityType: string; entityId: string; createdAt: string }[]; ownerId: string }) {
  return <section className="pt-6"><header className="mb-4"><h2 className="text-base font-semibold">Audit log</h2><p className="mt-1 text-xs text-muted">Project configuration and release actions.</p></header><Card className="overflow-hidden">{entries.length ? <><ul className="divide-y divide-border md:hidden">{entries.map((entry) => <li key={entry.id} className="space-y-1.5 p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium">{entry.action.replaceAll(".", " ")}</span><time className="shrink-0 text-[10px] text-muted" dateTime={entry.createdAt} title={new Date(entry.createdAt).toLocaleString()}>{relativeTime(entry.createdAt)}</time></div><p className="text-[11px] text-muted">{entry.actorId === ownerId ? "Workspace owner" : "System"} · {entry.entityType} <code className="font-mono">{entry.entityId.slice(0, 8)}</code></p></li>)}</ul><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[600px] text-left text-xs"><thead className="bg-[var(--surface-raised)] text-[10px] uppercase tracking-wide text-muted"><tr><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Entity</th><th className="px-4 py-3">Time</th></tr></thead><tbody className="divide-y divide-border">{entries.map((entry) => <tr key={entry.id}><td className="px-4 py-3">{entry.actorId === ownerId ? "Workspace owner" : "System"}</td><td className="px-4 py-3 font-medium">{entry.action.replaceAll(".", " ")}</td><td className="px-4 py-3 text-muted">{entry.entityType} · <code className="font-mono">{entry.entityId.slice(0, 8)}</code></td><td className="px-4 py-3 text-muted"><time dateTime={entry.createdAt} title={new Date(entry.createdAt).toLocaleString()}>{relativeTime(entry.createdAt)}</time></td></tr>)}</tbody></table></div></> : <EmptyState title="No audit events yet" description="Changes to repositories, environments, and releases will be recorded here." />}</Card></section>;
}

function DeploymentSummary({ item, projectId }: { item: NonNullable<Awaited<ReturnType<typeof listProjectDeployments>>>[number]; projectId: string }) {
  return <li><Link href={`/projects/${projectId}/deployments/${item.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface-raised)] sm:px-5"><StatusIcon status={item.status} /><div className="min-w-[140px] flex-1"><p className="text-xs font-medium">{environmentName(item.environment?.type)} <span className="text-muted">·</span> <code className="font-mono">{item.commitSha.slice(0, 8)}</code></p><p className="mt-1 truncate font-mono text-[10px] text-muted">{item.imageRef}</p></div><StatusBadge status={item.status} /><time className="text-[10px] text-muted" dateTime={item.createdAt} title={new Date(item.createdAt).toLocaleString()}>{relativeTime(item.createdAt)}</time></Link></li>;
}

function StatusIcon({ status }: { status?: DeploymentStatus }) {
  const label = status === "SUCCEEDED" ? "Successful" : status === "FAILED" ? "Failed" : status === "RUNNING" ? "Running" : status === "CANCELLED" ? "Cancelled" : status === "PENDING" ? "Pending" : "Unknown";
  const color = status === "SUCCEEDED" ? "text-[var(--success)]" : status === "FAILED" ? "text-[var(--danger)]" : status === "RUNNING" ? "text-[var(--info)]" : status === "CANCELLED" ? "text-[var(--warning)]" : "text-muted";
  const icon = status === "SUCCEEDED" ? "✓" : status === "FAILED" ? "×" : status === "RUNNING" ? "◌" : status === "CANCELLED" ? "⊘" : "◷";
  return <span aria-label={label} className={`grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-raised)] ${color}`}>{icon}</span>;
}

function Notice({ children, tone }: { children: string; tone: "success" | "warning" | "danger" }) {
  const color = tone === "success" ? "var(--success)" : tone === "warning" ? "var(--warning)" : "var(--danger)";
  return <p role={tone === "danger" ? "alert" : "status"} className="mt-5 rounded-lg border px-4 py-3 text-sm" style={{ borderColor: `color-mix(in srgb, ${color} 30%, transparent)`, backgroundColor: `color-mix(in srgb, ${color} 9%, transparent)`, color }}>{children}</p>;
}

function errorMessage(error: string) {
  if (error === "repository-invalid") return "Enter a valid GitHub owner and repository name.";
  if (error.startsWith("repository")) return "The GitHub repository could not be saved. Please try again.";
  if (error === "environment-invalid") return "Check the environment values and try again.";
  if (error.startsWith("environment")) return "The environment could not be saved. Please try again.";
  if (error === "rollback-invalid") return "Only a successful deployment in this project can be rolled back.";
  if (error.startsWith("rollback")) return "The rollback record could not be created. Please try again.";
  return "The project could not be archived. Please try again.";
}
function environmentName(type?: string) { return type === "DEVELOPMENT" ? "Development" : type === "STAGING" ? "Staging" : type === "PRODUCTION" ? "Production" : "Environment"; }
function duration(start?: string | null, finish?: string | null) { return start && finish ? `${Math.max(0, Math.round((Date.parse(finish) - Date.parse(start)) / 1000))}s` : "—"; }
function relativeTime(value: string) { const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60_000)); if (minutes < 1) return "Just now"; if (minutes < 60) return `${minutes} min ago`; const hours = Math.floor(minutes / 60); return hours < 24 ? `${hours} hr ago` : `${Math.floor(hours / 24)} days ago`; }

function ProjectFallback() {
  return <main aria-label="Loading project" className="mx-auto max-w-6xl animate-pulse px-5 py-7 sm:px-8 lg:px-10"><div className="mb-5 h-4 w-24 rounded bg-[var(--surface-raised)]" /><div className="mb-7 h-16 w-72 rounded bg-[var(--surface-raised)]" /><div className="h-10 border-b border-border" /><div className="mt-6 grid gap-3 lg:grid-cols-3"><div className="h-52 rounded-xl border border-border bg-surface" /><div className="h-52 rounded-xl border border-border bg-surface" /><div className="h-52 rounded-xl border border-border bg-surface" /></div></main>;
}
