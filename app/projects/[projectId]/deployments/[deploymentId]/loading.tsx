export default function DeploymentLoading() {
  return <main aria-label="Loading deployment" className="mx-auto max-w-5xl animate-pulse px-5 py-7 sm:px-8 lg:px-10"><div className="mb-6 h-4 w-48 rounded bg-[var(--surface-raised)]" /><div className="mb-6 h-16 w-full max-w-xl rounded bg-[var(--surface-raised)]" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-20 rounded-xl border border-border bg-surface" />)}</div><div className="mt-8 h-80 rounded-xl border border-border bg-surface" /></main>;
}
