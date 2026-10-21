import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getDashboardDeployments } from "../../lib/data/deployments";

export default function DashboardPage() {
  return <Suspense fallback={<DashboardFallback />}><DashboardContent /></Suspense>;
}

async function DashboardContent() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let projects;
  try {
    projects = await getDashboardDeployments(userId);
  } catch {
    return <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10"><h1 className="text-3xl font-semibold">Dashboard</h1><p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Deployment activity could not be loaded. Please try again.</p></main>;
  }

  const all = projects.flatMap(({ project, environments, deployments }) => deployments.map((deployment) => ({ project, environment: environments.find((item) => item.id === deployment.environmentId), deployment })));
  const latest = new Map<string, (typeof all)[number]>();
  for (const item of all) {
    const key = `${item.project.id}:${item.environment?.id ?? item.deployment.environmentId}`;
    if (!latest.has(key)) latest.set(key, item);
  }
  const latestSuccessful = new Map<string, (typeof all)[number]>();
  for (const item of all) {
    const key = `${item.project.id}:${item.environment?.id ?? item.deployment.environmentId}`;
    if (item.deployment.status === "SUCCEEDED" && !latestSuccessful.has(key)) latestSuccessful.set(key, item);
  }

  return <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-sm font-medium text-indigo-700">Workspace</p><h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1><p className="mt-2 text-sm text-slate-500">From commit to deployment, all in one place.</p></div><Link href="/projects/new" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Create project</Link></header>
    {projects.length === 0 ? <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm"><h2 className="text-lg font-semibold">Your projects will show up here</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Create a project to organize its environments, deployment history, and releases.</p><Link href="/projects/new" className="mt-6 inline-flex rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Create your first project</Link></section> : <>
      <section className="grid gap-4 sm:grid-cols-3"><SummaryCard label="Active projects" value={String(projects.length)} /><SummaryCard label="Deployments" value={String(all.length)} /><SummaryCard label="Failed latest status" value={String([...latest.values()].filter((item) => item.deployment.status === "FAILED").length)} /></section>
      <section className="mt-8 grid gap-6 lg:grid-cols-2"><SummaryList title="Latest deployment per environment" items={[...latest.values()]} /><SummaryList title="Latest successful release" items={[...latestSuccessful.values()]} /></section>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold">Recent deployment activity</h2>{all.length === 0 ? <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No deployments have been reported yet. Connect a deployment sender to start tracking releases.</p> : <ul className="mt-4 divide-y divide-slate-100">{all.slice(0, 12).map(({ project, environment, deployment }) => <li key={deployment.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><Link href={`/projects/${project.id}`} className="font-medium hover:text-indigo-700">{project.name}</Link><p className="mt-1 text-xs text-slate-500">{environment?.type ?? "Environment"} · {deployment.commitSha}</p></div><span className="text-xs text-slate-500">{deployment.status} · {deployment.createdAt ? new Date(deployment.createdAt).toLocaleString() : "Time unavailable"}</span></li>)}</ul>}</section>
    </>}
  </main>;
}

function SummaryCard({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>; }
function SummaryList({ title, items }: { title: string; items: Array<{ project: { id: string; name: string }; environment?: { type: string }; deployment: { id: string; status: string; commitSha: string; createdAt: string } }> }) { return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold">{title}</h2>{items.length ? <ul className="mt-3 divide-y divide-slate-100">{items.map(({ project, environment, deployment }) => <li key={deployment.id} className="py-3"><Link href={`/projects/${project.id}`} className="font-medium hover:text-indigo-700">{project.name}</Link><p className="mt-1 text-xs text-slate-500">{environment?.type ?? "Environment"} · {deployment.status} · {deployment.commitSha}</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No deployment releases yet.</p>}</section>; }
function DashboardFallback() { return <main aria-label="Loading dashboard" className="mx-auto w-full max-w-6xl animate-pulse px-5 py-8 sm:px-8 lg:px-10"><div className="mb-8 h-10 w-48 rounded bg-slate-200" /><div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 rounded-2xl bg-white" />)}</div></main>; }
