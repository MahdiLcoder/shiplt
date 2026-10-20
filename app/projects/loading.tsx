export default function ProjectsLoading() {
  return (
    <main aria-label="Loading projects" className="mx-auto max-w-6xl animate-pulse px-5 py-8 sm:px-8 lg:px-10">
      <div className="h-8 w-48 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-80 rounded bg-slate-200" />
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="h-36 rounded-2xl border border-slate-200 bg-white" />
        <div className="h-36 rounded-2xl border border-slate-200 bg-white" />
      </div>
    </main>
  );
}
