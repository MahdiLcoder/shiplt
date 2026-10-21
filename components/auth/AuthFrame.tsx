import Link from "next/link";
import type { ReactNode } from "react";

export function AuthFrame({ children }: { children: ReactNode }) {
  return <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-5 py-10 text-foreground"><div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--accent)_16%,transparent),transparent_70%)]" /><header className="relative z-10 mb-7 text-center"><Link href="/" className="inline-flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-white">S</span><span className="text-sm font-semibold tracking-tight">ShipIt</span></Link><p className="mt-3 text-sm text-muted">From commit to deployment, all in one place.</p></header><div className="relative z-10 w-full max-w-[440px]">{children}</div></main>;
}

export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--accent)",
    colorPrimaryForeground: "#ffffff",
    colorBackground: "var(--surface)",
    colorForeground: "var(--foreground)",
    colorMutedForeground: "var(--muted)",
    colorBorder: "var(--border)",
    colorInput: "var(--background)",
    colorInputForeground: "var(--foreground)",
    fontFamily: "var(--font-geist-sans)",
    fontFamilyButtons: "var(--font-geist-sans)",
    borderRadius: "0.5rem",
  },
  elements: {
    card: "border border-border shadow-none",
    headerTitle: "text-foreground",
    headerSubtitle: "text-muted",
    formFieldLabel: "text-foreground",
    formFieldInput: "bg-background text-foreground",
    footerActionText: "text-muted",
  },
};
