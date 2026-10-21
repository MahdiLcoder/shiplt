export default function ProjectsLoading() {
  return (
    <main aria-label="Loading projects" className="mx-auto max-w-6xl animate-pulse px-5 py-7 sm:px-8 lg:px-10">
      <div className="h-16 w-64 rounded-lg bg-[var(--surface-raised)]" />
      <div className="mt-6 h-10 rounded-lg bg-[var(--surface-raised)]" />
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="h-48 rounded-xl border border-border bg-surface" />
        <div className="h-48 rounded-xl border border-border bg-surface" />
        <div className="h-48 rounded-xl border border-border bg-surface" />
      </div>
    </main>
  );
}
