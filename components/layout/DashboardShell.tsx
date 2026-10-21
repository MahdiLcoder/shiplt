"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "../ui/ThemeToggle";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: "▦" },
  { label: "Projects", href: "/projects", icon: "◇" },
  { label: "Activity", href: "/dashboard/activity", icon: "◷" },
  { label: "Settings", href: "/dashboard/settings", icon: "⚙" },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const title = pathname === "/dashboard" ? "Overview" : pathname === "/dashboard/activity" ? "Activity" : pathname === "/dashboard/settings" ? "Settings" : pathname.startsWith("/projects") ? "Projects" : pathname.slice(1).replaceAll("/", " · ");

  function closeDrawer() {
    setDrawerOpen(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      {drawerOpen && <button aria-label="Close navigation" onClick={closeDrawer} className="fixed inset-0 z-30 bg-black/55 md:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-border bg-surface transition-transform duration-200 md:sticky md:top-0 md:h-screen md:shrink-0 md:translate-x-0 ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Link href="/dashboard" onClick={closeDrawer} className="flex h-16 items-center gap-3 border-b border-border px-5">
          <span className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-white">S</span>
          <span className="text-sm font-semibold tracking-tight">ShipIt</span>
          <span className="ml-auto rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted">BETA</span>
        </Link>
        <div className="px-3 pt-5">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Workspace</p>
          <nav aria-label="Main navigation" className="space-y-1">
            {navigation.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
              return <Link key={item.label} href={item.href} onClick={closeDrawer} aria-current={active ? "page" : undefined} className={`flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm transition ${active ? "bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] font-medium text-accent" : "text-muted hover:bg-[var(--surface-raised)] hover:text-foreground"}`}><span aria-hidden="true" className="grid w-4 place-items-center text-base">{item.icon}</span>{item.label}</Link>;
            })}
          </nav>
        </div>
        <div className="mt-auto border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-[var(--surface-raised)] p-3">
            <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
            <div className="min-w-0"><p className="text-xs font-medium">Account</p><p className="truncate text-[11px] text-muted">Manage your profile</p></div>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-[color-mix(in_srgb,var(--background)_88%,transparent)] px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Open navigation" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)} className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-muted md:hidden"><span aria-hidden="true">☰</span></button>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-xs"><Link href="/dashboard" className="text-muted hover:text-foreground">Workspace</Link><span aria-hidden="true" className="text-muted">/</span><span aria-current="page" className="truncate font-medium">{title}</span></nav>
          </div>
          <div className="flex shrink-0 items-center gap-2"><span className="hidden font-mono text-[10px] text-muted sm:inline">shipit / cloud</span><ThemeToggle /><div className="md:hidden"><UserButton appearance={{ elements: { avatarBox: "size-8" } }} /></div></div>
        </header>
        <div className="mx-auto w-full max-w-[1440px]">{children}</div>
      </div>
    </div>
  );
}
