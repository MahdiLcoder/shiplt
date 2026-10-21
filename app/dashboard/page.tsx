import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-indigo-700">Workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">
            From commit to deployment, all in one place.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Create project
        </Link>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm sm:px-12">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-700">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-7">
            <path
              d="M5 19V9l7-5 7 5v10M9 19v-6h6v6M3 19h18"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">Your projects will show up here</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Create a project to organize its environments, deployment history, and releases.
        </p>
        <Link
          href="/projects/new"
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Create your first project
        </Link>
      </section>
    </main>
  );
}

function DashboardFallback() {
  return (
    <main
      aria-label="Loading dashboard"
      className="mx-auto w-full max-w-6xl animate-pulse px-5 py-8 sm:px-8 lg:px-10"
    >
      <div className="mb-8 space-y-3">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-9 w-48 rounded bg-slate-200" />
        <div className="h-4 w-72 max-w-full rounded bg-slate-200" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 shadow-sm">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-50" />
        <div className="mx-auto mt-5 h-6 w-64 max-w-full rounded bg-slate-200" />
        <div className="mx-auto mt-3 h-4 w-80 max-w-full rounded bg-slate-100" />
      </div>
    </main>
  );
}
