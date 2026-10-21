import { ThemeToggle } from "../../../components/ui/ThemeToggle";
import { Card } from "../../../components/ui/primitives";

export default function SettingsPage() {
  return <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
    <header className="mb-7"><p className="mb-2 text-xs font-medium text-accent">WORKSPACE</p><h1 className="text-2xl font-semibold tracking-tight">Settings</h1><p className="mt-2 text-sm text-muted">Manage your dashboard preferences and account.</p></header>
    <Card className="flex items-center justify-between gap-5 p-5"><div><h2 className="text-sm font-semibold">Appearance</h2><p className="mt-1 text-sm text-muted">Choose a light or dark dashboard theme. System preference is used by default.</p></div><ThemeToggle /></Card>
    <Card className="mt-4 flex items-center justify-between gap-5 p-5"><div><h2 className="text-sm font-semibold">Account</h2><p className="mt-1 text-sm text-muted">Profile and sign-in details are managed through your account menu.</p></div><span className="text-xs text-muted">Clerk</span></Card>
  </main>;
}
