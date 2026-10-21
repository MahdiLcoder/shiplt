import { Card, Button, DataTable, EmptyState, Input, Skeleton, StatusBadge } from "../../../components/ui/primitives";
import { CopyButton } from "../../../components/ui/CopyButton";
import { ThemeToggle } from "../../../components/ui/ThemeToggle";

export default function UiShowcasePage() {
  return <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
    <header className="mb-10 flex items-start justify-between gap-4"><div><p className="font-mono text-xs text-accent">SHIPIT / COMPONENTS</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">UI foundations</h1><p className="mt-2 text-sm text-muted">A compact reference for the dashboard’s tokens, controls, and deployment states.</p></div><ThemeToggle /></header>
    <div className="grid gap-5 md:grid-cols-2">
      <Card className="p-5"><h2 className="text-sm font-semibold">Actions</h2><div className="mt-4 flex flex-wrap gap-2"><Button variant="primary">Create project</Button><Button>Secondary</Button><Button variant="ghost">Quiet action</Button><Button variant="danger">Delete</Button></div></Card>
      <Card className="p-5"><h2 className="text-sm font-semibold">Form control</h2><label htmlFor="ui-search" className="mb-2 mt-4 block text-xs font-medium text-muted">Repository name</label><Input id="ui-search" placeholder="acme/payments-api" /></Card>
      <Card className="p-5"><h2 className="text-sm font-semibold">Deployment status</h2><div className="mt-4 flex flex-wrap gap-2">{(["PENDING", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED"] as const).map((status) => <StatusBadge key={status} status={status} />)}</div></Card>
      <Card className="p-5"><h2 className="text-sm font-semibold">Reference and loading</h2><div className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--surface-raised)] px-3 py-2"><code className="min-w-0 flex-1 truncate font-mono text-xs text-muted">registry.shipit.dev/acme/payments:9d42be1</code><CopyButton value="registry.shipit.dev/acme/payments:9d42be1" /></div><Skeleton className="mt-4 h-2 w-full" /></Card>
    </div>
    <Card className="mt-5"><EmptyState title="No deployments yet" description="Connect a deployment event source to see releases and health for each environment." action={<Button variant="primary">Connect a project</Button>} /></Card>
    <div className="mt-5"><DataTable headers={["Project", "Environment", "Latest status"]}><tr><td className="px-4 py-3 font-medium">Payments API</td><td className="px-4 py-3 text-muted">Production</td><td className="px-4 py-3"><StatusBadge status="SUCCEEDED" /></td></tr></DataTable></div>
    <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Background", "var(--background)"], ["Surface", "var(--surface)"], ["Border", "var(--border)"], ["Accent", "var(--accent)"]].map(([name, color]) => <div key={name} className="rounded-lg border border-border bg-surface p-3"><span className="mb-2 block h-8 rounded border border-border" style={{ backgroundColor: color }} /><span className="text-xs text-muted">{name}</span></div>)}</section>
  </main>;
}
