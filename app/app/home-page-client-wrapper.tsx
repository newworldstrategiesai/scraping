"use client";

import dynamic from "next/dynamic";
import { HomeErrorBoundary } from "@/components/error-boundary";

const HomePageClient = dynamic(() => import("./home-page-client").then((m) => ({ default: m.HomePageClient })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground p-4">
      <h1 className="text-2xl font-semibold">Southern Tree & Renovations</h1>
      <p className="text-muted-foreground">Loading…</p>
    </div>
  ),
});

export function HomePageClientWrapper() {
  return (
    <HomeErrorBoundary>
      <HomePageClient />
    </HomeErrorBoundary>
  );
}
