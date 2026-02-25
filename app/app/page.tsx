import Link from "next/link";
import { Nav } from "@/components/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getConfig } from "@/lib/actions/config";
import { getJobs } from "@/lib/actions/jobs";

export default async function HomePage() {
  const [config, jobs] = await Promise.all([getConfig(), getJobs()]);
  const pending = jobs.filter((j) => j.status === "pending").length;
  const hasSupabase = config !== null;

  return (
    <>
      <Nav currentPath="/" />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Connection</CardTitle>
              <CardDescription>
                {hasSupabase
                  ? "Supabase connected. Run supabase/schema.sql in your project if you haven’t."
                  : "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then run supabase/schema.sql in SQL Editor."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasSupabase ? (
                <p className="text-sm text-muted-foreground">
                  Config: {config?.company_name ?? "default"}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add env vars and run the schema to enable settings and jobs.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Jobs</CardTitle>
              <CardDescription>
                {hasSupabase
                  ? `${pending} pending. Jobs run when a worker is connected.`
                  : "Job list will appear here after Supabase is connected."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/jobs">View jobs</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="mt-8 flex gap-4">
          <Button asChild>
            <Link href="/settings">Settings</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/actions">Run actions</Link>
          </Button>
        </div>
      </main>
    </>
  );
}
