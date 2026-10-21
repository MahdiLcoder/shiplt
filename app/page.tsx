import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const features = [
  { icon: "⌁", title: "Track every release", text: "See status, image, commit, and timing in one deployment history." },
  { icon: "◈", title: "Know environment health", text: "Compare development, staging, and production at a glance." },
  { icon: "↶", title: "Recover with context", text: "Review release events and roll back to a known good image." },
];

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return <main className="min-h-screen bg-background text-foreground"><header className="mx-auto flex h-16 max-w-6xl items-center justify-between border-b border-border px-5 sm:px-8"><Link href="/" className="inline-flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-white">S</span><span className="text-sm font-semibold">ShipIt</span></Link><nav aria-label="Account" className="flex items-center gap-2"><Link href="/sign-in" className="inline-flex h-9 items-center rounded-lg px-3 text-sm text-muted hover:bg-[var(--surface-raised)] hover:text-foreground">Sign in</Link><Link href="/sign-up" className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-sm font-medium text-white hover:bg-[var(--accent-strong)]">Get started</Link></nav></header>
    <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-24 sm:px-8 sm:pb-24 sm:pt-32"><div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-0 mx-auto h-[420px] max-w-4xl bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--accent)_17%,transparent),transparent_68%)]" /><div className="relative mx-auto max-w-3xl text-center"><span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-muted"><span className="size-1.5 rounded-full bg-[var(--success)]" />Deployment visibility for your stack</span><h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">Ship with a clear view<br className="hidden sm:block" /> of every environment.</h1><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">From commit to deployment, all in one place. Know what’s deployed where, and whether it’s healthy.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/sign-up" className="inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]">Get started <span aria-hidden="true" className="ml-2">→</span></Link><Link href="/sign-in" className="inline-flex h-11 items-center rounded-lg border border-border bg-surface px-5 text-sm font-medium hover:bg-[var(--surface-raised)]">Sign in</Link></div></div>
      <div className="mx-auto mt-20 grid max-w-5xl gap-3 md:grid-cols-3">{features.map((feature) => <article key={feature.title} className="rounded-xl border border-border bg-surface/80 p-5"><span aria-hidden="true" className="grid size-9 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-sm text-accent">{feature.icon}</span><h2 className="mt-4 text-sm font-semibold">{feature.title}</h2><p className="mt-2 text-xs leading-5 text-muted">{feature.text}</p></article>)}</div>
    </section><footer className="border-t border-border px-5 py-5 text-center text-[11px] text-muted">ShipIt · Deployment health, from commit to production.</footer>
  </main>;
}
