"use client";

export default function ProjectsError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <section role="alert" className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-surface p-8">
        <h1 className="text-lg font-semibold">Projects are temporarily unavailable</h1>
        <p className="mt-2 text-sm text-muted">We couldn’t load this page. Try again in a moment.</p>
        <button onClick={reset} className="mt-5 inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-sm font-medium text-white hover:bg-[var(--accent-strong)]">
          Try again
        </button>
      </section>
    </main>
  );
}
