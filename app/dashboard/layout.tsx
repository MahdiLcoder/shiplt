import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-950 md:flex">
      <aside className="flex w-full flex-col border-b border-slate-200 bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="flex h-16 items-center gap-3 px-6">
          <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            S
          </span>
          <span className="text-base font-semibold tracking-tight">ShipIt</span>
        </div>

        <nav aria-label="Main navigation" className="flex gap-2 px-4 pb-4 md:flex-1 md:flex-col md:pt-6">
          <Link
            href="/dashboard"
            className="rounded-lg bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-700"
          >
            Dashboard
          </Link>
          <Link
            href="/projects"
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            Projects
          </Link>
        </nav>

        <div className="flex items-center gap-3 border-t border-slate-200 px-5 py-4">
          <UserButton />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Signed in</p>
            <p className="text-sm font-medium">Your account</p>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
