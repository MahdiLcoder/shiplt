"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-5 py-16 text-center"><span aria-hidden="true" className="grid size-11 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-lg text-[var(--danger)]">!</span><h1 className="mt-5 text-xl font-semibold">Something went wrong</h1><p className="mt-2 text-sm leading-6 text-muted">This page couldn’t load. You can retry or return to your workspace.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><button onClick={reset} className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-sm font-medium text-white hover:bg-[var(--accent-strong)]">Try again</button><Link href="/dashboard" className="inline-flex h-9 items-center rounded-lg border border-border px-3.5 text-sm font-medium hover:bg-[var(--surface-raised)]">Dashboard</Link></div></main>;
}
