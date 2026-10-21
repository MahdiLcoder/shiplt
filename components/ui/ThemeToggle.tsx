"use client";

export function ThemeToggle() {
  function toggleTheme() {
    const stored = document.documentElement.dataset.theme;
    const current = stored === "light" || (stored !== "dark" && window.matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("shipit-theme", next);
  }

  return (
    <button type="button" onClick={toggleTheme} aria-label="Toggle color theme" className="grid size-9 place-items-center rounded-lg border border-border bg-surface text-muted transition hover:bg-[var(--surface-raised)] hover:text-foreground">
      <span className="theme-icon-light" aria-hidden="true">☼</span>
      <span className="theme-icon-dark" aria-hidden="true">☾</span>
    </button>
  );
}
