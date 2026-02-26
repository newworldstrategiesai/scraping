import Link from "next/link";
import { Nav } from "@/components/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSubmissions } from "@/lib/actions/submissions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Form Submissions | Lead Automation",
  description: "View contact form submissions from the website",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default async function SubmissionsPage() {
  const submissions = await getSubmissions();

  return (
    <>
      <Nav currentPath="/dashboard/submissions" />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Form Submissions</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Contact / quote form</CardTitle>
            <CardDescription>
              Submissions from the &quot;Get a Free Quote&quot; form on the home page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No submissions yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="max-w-[240px]">Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {formatDate(row.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">{row.name ?? "—"}</TableCell>
                      <TableCell>
                        {row.phone ? (
                          <a href={`tel:${row.phone.replace(/\D/g, "")}`} className="hover:underline">
                            {row.phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {row.email ? (
                          <a href={`mailto:${row.email}`} className="hover:underline">
                            {row.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate">
                        {row.address ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-muted-foreground text-sm">
                        {row.message ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
