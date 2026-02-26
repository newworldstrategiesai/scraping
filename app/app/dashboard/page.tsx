import Link from "next/link";
import { Nav } from "@/components/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getConfig } from "@/lib/actions/config";
import { getJobs } from "@/lib/actions/jobs";
import { getWarmLeadCounts } from "@/lib/actions/lists";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Lead Automation",
  description: "Control parameters and run jobs for PropWire → CBC → SMS pipeline",
};

export default async function DashboardPage() {
  const [config, jobs, warmCounts] = await Promise.all([getConfig(), getJobs(), getWarmLeadCounts()]);
  const pending = jobs.filter((j) => j.status === "pending").length;
  const hasSupabase = config !== null;

  return (
    <>
      <Nav currentPath="/dashboard" />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Connection</CardTitle>
              <CardDescription>
                {hasSupabase
                  ? "Supabase connected. Run supabase/schema.sql in your project if you haven't."
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
          <Card>
            <CardHeader>
              <CardTitle>Warm leads</CardTitle>
              <CardDescription>
                Opt-ins from SMS (reply YES). Target 10–16 per day.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{warmCounts.today}</strong> today · <strong className="text-foreground">{warmCounts.thisWeek}</strong> this week
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/lists?tab=warm_leads">View warm leads</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lists</CardTitle>
              <CardDescription>
                View and manage SMS list, opt-outs, warm leads, address lists, and lead lists.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/lists">View lists</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Form Submissions</CardTitle>
              <CardDescription>
                Contact form submissions from the website &quot;Get a Free Quote&quot; section.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/dashboard/submissions">View submissions</Link>
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
