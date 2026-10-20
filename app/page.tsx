import { Suspense } from "react";
import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-zinc-950">
      <header className="flex w-full items-center justify-between border-b border-zinc-200 px-6 py-4 sm:px-10">
        <Link className="text-lg font-semibold tracking-tight" href="/">
          Shiplt
        </Link>
        <nav aria-label="Account" className="flex items-center gap-3">
          <Suspense
            fallback={<span aria-hidden="true" className="h-9 w-28" />}
          >
            <Show when="signed-out">
              <Link
                className="rounded-full px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                href="/sign-in"
              >
                Sign in
              </Link>
              <Link
                className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                href="/sign-up"
              >
                Create account
              </Link>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </Suspense>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Welcome to Shiplt
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
          Your next idea starts here.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">
          Sign in to continue, or create an account to get started.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Suspense
            fallback={<span aria-hidden="true" className="h-12 w-52" />}
          >
            <Show when="signed-out">
              <Link
                className="rounded-full bg-zinc-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                href="/sign-up"
              >
                Get started
              </Link>
              <Link
                className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-50"
                href="/sign-in"
              >
                Sign in
              </Link>
            </Show>
            <Show when="signed-in">
              <Link
                className="rounded-full bg-zinc-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                href="/dashboard"
              >
                Open dashboard
              </Link>
            </Show>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
