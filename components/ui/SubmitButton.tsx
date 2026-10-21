"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className = "" }: { children: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-wait disabled:opacity-65 ${className}`}>{pending && <span aria-hidden="true" className="size-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}{pending ? "Saving…" : children}</button>;
}
