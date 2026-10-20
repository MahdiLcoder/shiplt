"use client";

export default function ProjectsError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <section role="alert" className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold">Projects are temporarily unavailable</h1>
        <p className="mt-2 text-sm text-slate-600">We couldn’t load this page. Try again in a moment.</p>
        <button onClick={reset} className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
          Try again
        </button>
      </section>
    </main>
  );
}
