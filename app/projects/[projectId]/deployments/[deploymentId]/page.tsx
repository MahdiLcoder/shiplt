import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import type { DeploymentStatus } from "../../../../generated/prisma/enums";
import { io } from "next/cache";
import { createRollbackAction } from "../../../actions";
import { getLatestEnvironmentDeployment, getProjectDeployment } from "../../../../../lib/data/deployments";
import { Card, EmptyState, StatusBadge } from "../../../../../components/ui/primitives";
import { CopyButton } from "../../../../../components/ui/CopyButton";
import { ConfirmAction } from "../../../../../components/ui/ConfirmAction";

type DeploymentDetailProps = { params: Promise<{ projectId: string; deploymentId: string }> };

export default function DeploymentDetailPage(props: DeploymentDetailProps) {
  return <Suspense fallback={<DeploymentFallback />}><DeploymentContent {...props} /></Suspense>;
}

async function DeploymentContent({ params }: DeploymentDetailProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { projectId, deploymentId } = await params;
  await io();
  const deployment = await getProjectDeployment(userId, projectId, deploymentId);
  if (!deployment) notFound();
  const current = await getLatestEnvironmentDeployment(userId, projectId, deployment.environmentId);
  const mayRollback = deployment.status === "SUCCEEDED" && current?.id !== deployment.id;

  return <main className="mx-auto w-full max-w-5xl px-5 py-7 sm:px-8 lg:px-10">
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted"><Link href={`/projects/${projectId}`} className="hover:text-foreground">Project</Link><span aria-hidden="true">/</span><Link href={`/projects/${projectId}?tab=deployments`} className="hover:text-foreground">Deployments</Link><span aria-hidden="true">/</span><span className="font-mono">{deployment.id.slice(0, 8)}</span></div>
    <header className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-3"><StatusBadge status={deployment.status} /><span className="text-sm text-muted">{environmentName(deployment.environment?.type)}</span></div><h1 className="mt-4 text-2xl font-semibold tracking-tight">Deployment <span className="font-mono text-muted">#{deployment.id.slice(0, 8)}</span></h1>{deployment.rollbackOfId && <p className="mt-2 text-sm text-muted">Rollback of <Link href={`/projects/${projectId}/deployments/${deployment.rollbackOfId}`} className="font-mono text-accent hover:underline">#{deployment.rollbackOfId.slice(0, 8)}</Link></p>}</div><div>{mayRollback ? <ConfirmAction action={createRollbackAction} fields={{ projectId, deploymentId }} trigger="Roll back to this release" title="Create rollback?" description={`A new pending deployment will target ${deployment.imageRef}. Your deployment pipeline will receive the record and perform the rollback.`} confirmLabel="Create rollback" /> : <button type="button" disabled title={deployment.status === "SUCCEEDED" ? "This release is already current in its environment." : "Only successful releases can be rolled back."} className="h-9 cursor-not-allowed rounded-lg border border-border px-3.5 text-sm font-medium text-muted opacity-60">Roll back to this release</button>}</div></header>

    <section aria-label="Deployment details" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><DetailCard label="Commit" value={deployment.commitSha} copyValue={deployment.commitSha} mono /><DetailCard label="Image reference" value={deployment.imageRef} copyValue={deployment.imageRef} mono /><DetailCard label="Started" value={absoluteTime(deployment.startedAt)} /><DetailCard label="Duration" value={duration(deployment.startedAt, deployment.finishedAt)} /></section>

    {deployment.failureMessage && <section className="mt-6 rounded-xl border border-[color-mix(in_srgb,var(--danger)_32%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-[var(--danger)]">Deployment failed</h2><p className="mt-1 text-xs text-muted">Failure message reported by the deployment system.</p></div><CopyButton value={deployment.failureMessage} /></div><pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-[color-mix(in_srgb,var(--danger)_20%,transparent)] bg-background/50 p-3 font-mono text-xs leading-5 text-foreground">{deployment.failureMessage}</pre></section>}

    <section className="mt-8"><div className="mb-4"><h2 className="text-base font-semibold">Event timeline</h2><p className="mt-1 text-xs text-muted">Status changes reported for this deployment.</p></div><Card className="p-5 sm:p-6">{deployment.events.length ? <ol className="space-y-0">{deployment.events.map((event, index) => <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0"><div className="relative flex w-4 justify-center"><span className={`relative z-10 mt-0.5 grid size-4 place-items-center rounded-full border text-[9px] ${event.status === "SUCCEEDED" ? "border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_14%,var(--surface))] text-[var(--success)]" : event.status === "FAILED" ? "border-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_12%,var(--surface))] text-[var(--danger)]" : event.status === "RUNNING" ? "border-[var(--info)] bg-[color-mix(in_srgb,var(--info)_10%,transparent)] text-[var(--info)]" : "border-border bg-[var(--surface-raised)] text-muted"}`}>{event.status === "SUCCEEDED" ? "✓" : event.status === "FAILED" ? "×" : event.status === "RUNNING" ? "◌" : event.status === "CANCELLED" ? "⊘" : "◷"}</span>{index < deployment.events.length - 1 && <span aria-hidden="true" className="absolute top-4 h-full w-px bg-border" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={event.status as DeploymentStatus} /><time dateTime={event.occurredAt} title={new Date(event.occurredAt).toLocaleString()} className="text-[11px] text-muted">{relativeTime(event.occurredAt)}</time></div>{event.message && <p className="mt-2 text-xs leading-5 text-muted">{event.message}</p>}</div></li>)}</ol> : <EmptyState title="No event timeline" description="The deployment was recorded without status event details." />}</Card></section>
  </main>;
}

function DetailCard({ label, value, copyValue, mono = false }: { label: string; value: string; copyValue?: string; mono?: boolean }) {
  return <Card className="min-w-0 p-4"><p className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</p><div className="mt-2 flex min-w-0 items-center gap-1"><p className={`min-w-0 flex-1 truncate text-xs ${mono ? "font-mono" : ""}`} title={value}>{value}</p>{copyValue && <CopyButton value={copyValue} />}</div></Card>;
}

function environmentName(value?: string) { return value === "DEVELOPMENT" ? "Development" : value === "STAGING" ? "Staging" : value === "PRODUCTION" ? "Production" : "Environment"; }
function duration(start?: string | null, finish?: string | null) { return start && finish ? `${Math.max(0, Math.round((Date.parse(finish) - Date.parse(start)) / 1000))} seconds` : "In progress"; }
function absoluteTime(value?: string | null) { return value ? new Date(value).toLocaleString() : "Not started"; }
function relativeTime(value: string) { const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60_000)); if (minutes < 1) return "Just now"; if (minutes < 60) return `${minutes} min ago`; const hours = Math.floor(minutes / 60); return hours < 24 ? `${hours} hr ago` : `${Math.floor(hours / 24)} days ago`; }

function DeploymentFallback() {
  return <main aria-label="Loading deployment" className="mx-auto max-w-5xl animate-pulse px-5 py-7 sm:px-8 lg:px-10"><div className="mb-6 h-4 w-48 rounded bg-[var(--surface-raised)]" /><div className="mb-6 h-16 w-full max-w-xl rounded bg-[var(--surface-raised)]" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="h-20 rounded-xl border border-border bg-surface" /><div className="h-20 rounded-xl border border-border bg-surface" /><div className="h-20 rounded-xl border border-border bg-surface" /><div className="h-20 rounded-xl border border-border bg-surface" /></div><div className="mt-8 h-80 rounded-xl border border-border bg-surface" /></main>;
}
