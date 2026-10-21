export default function DashboardLoading() {
  return <main aria-label="Loading dashboard" className="mx-auto max-w-6xl animate-pulse px-5 py-7 sm:px-8 lg:px-10"><div className="mb-7 h-16 w-64 rounded-lg bg-[var(--surface-raised)]" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-28 rounded-xl border border-border bg-surface" />)}</div><div className="mt-8 h-80 rounded-xl border border-border bg-surface" /><div className="mt-8 h-64 rounded-xl border border-border bg-surface" /></main>;
}
