import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" };
const buttonVariants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-accent text-white hover:bg-[var(--accent-strong)]",
  secondary: "border border-border bg-surface text-foreground hover:bg-[var(--surface-raised)]",
  ghost: "text-muted hover:bg-[var(--surface-raised)] hover:text-foreground",
  danger: "border border-[color-mix(in_srgb,var(--danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_18%,transparent)]",
};

export function Button({ variant = "secondary", className = "", ...props }: ButtonProps) {
  return <button {...props} className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50 ${buttonVariants[variant]} ${className}`} />;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_25%,transparent)] ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_25%,transparent)] ${props.className ?? ""}`} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-border bg-surface ${className}`}>{children}</section>;
}

const badgeVariants: Record<string, string> = {
  PENDING: "border-border bg-[var(--surface-raised)] text-muted",
  RUNNING: "border-blue-400/25 bg-blue-400/10 text-blue-400",
  SUCCEEDED: "border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-[var(--success)]",
  FAILED: "border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-[var(--danger)]",
  CANCELLED: "border-[color-mix(in_srgb,var(--warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] text-[var(--warning)]",
};
const statusIcons: Record<string, string> = { PENDING: "◷", RUNNING: "◌", SUCCEEDED: "✓", FAILED: "×", CANCELLED: "⊘" };

export function StatusBadge({ status }: { status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED" }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${badgeVariants[status]}`}><span aria-hidden="true" className={status === "RUNNING" ? "animate-spin" : ""}>{statusIcons[status]}</span>{status[0] + status.slice(1).toLowerCase()}</span>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-[var(--surface-raised)] ${className}`} />;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center px-6 py-12 text-center"><span aria-hidden="true" className="mb-4 grid size-11 place-items-center rounded-xl border border-border bg-[var(--surface-raised)] text-lg text-muted">↗</span><h3 className="text-base font-semibold">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full border-collapse text-left text-sm"><thead className="bg-[var(--surface-raised)] text-xs font-medium uppercase tracking-wide text-muted"><tr>{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr></thead><tbody className="divide-y divide-border">{children}</tbody></table></div>;
}

