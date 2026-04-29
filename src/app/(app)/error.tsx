"use client";

import { Button } from "@components/shared";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-[1380px] px-4 py-8 md:px-8">
      <section className="app-card rounded-[10px] px-6 py-8">
        <h1 className="text-lg font-semibold text-slate-800">Unable to load this page</h1>
        <p className="mt-2 text-sm text-slate-500">{error.message || "Please try again."}</p>
        <Button className="mt-5" onClick={reset}>
          Try again
        </Button>
      </section>
    </main>
  );
}
