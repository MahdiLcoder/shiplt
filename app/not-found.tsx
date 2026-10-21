import Link from "next/link";

export default function NotFound() {
  return <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-5 py-16 text-center"><span className="font-mono text-xs font-medium text-accent">404 / NOT FOUND</span><h1 className="mt-4 text-2xl font-semibold tracking-tight">This page doesn’t exist</h1><p className="mt-2 text-sm leading-6 text-muted">The link may be outdated, or the resource may have been removed.</p><div className="mt-6 flex gap-2"><Link href="/dashboard" className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-sm font-medium text-white hover:bg-[var(--accent-strong)]">Go to dashboard</Link><Link href="/projects" className="inline-flex h-9 items-center rounded-lg border border-border px-3.5 text-sm font-medium hover:bg-[var(--surface-raised)]">Browse projects</Link></div></main>;
}
