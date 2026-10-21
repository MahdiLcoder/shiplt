"use client";

export function CopyButton({ value }: { value: string }) {
  return <button type="button" title="Copy to clipboard" aria-label={`Copy ${value}`} onClick={() => void navigator.clipboard.writeText(value)} className="rounded px-1.5 py-1 text-xs text-muted hover:bg-[var(--surface-raised)] hover:text-foreground">Copy</button>;
}
