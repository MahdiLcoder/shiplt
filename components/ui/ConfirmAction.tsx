"use client";

import { useRef } from "react";
import { SubmitButton } from "./SubmitButton";

type ConfirmActionProps = {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  trigger: string;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
};

export function ConfirmAction({ action, fields, trigger, title, description, confirmLabel, danger = false }: ConfirmActionProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = title.toLowerCase().replaceAll(" ", "-");

  return <>
    <button type="button" onClick={() => dialog.current?.showModal()} className={`inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium transition ${danger ? "border-[color-mix(in_srgb,var(--danger)_32%,transparent)] text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]" : "border-border text-muted hover:bg-[var(--surface-raised)] hover:text-foreground"}`}>{trigger}</button>
    <dialog ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} className="m-auto w-[min(92vw,440px)] rounded-xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/60">
      <div className="p-5 sm:p-6"><div className={`mb-4 grid size-9 place-items-center rounded-lg text-sm ${danger ? "bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]" : "bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-[var(--warning)]"}`} aria-hidden="true">!</div><h2 id={`${id}-title`} className="text-base font-semibold">{title}</h2><p id={`${id}-description`} className="mt-2 text-sm leading-6 text-muted">{description}</p><form action={action} className="mt-6 flex flex-wrap justify-end gap-2">{Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}<button type="button" onClick={() => dialog.current?.close()} className="inline-flex h-9 items-center rounded-lg px-3.5 text-sm font-medium text-muted hover:bg-[var(--surface-raised)]">Cancel</button><SubmitButton className={danger ? "bg-[var(--danger)] hover:opacity-90" : ""}>{confirmLabel}</SubmitButton></form></div>
    </dialog>
  </>;
}
