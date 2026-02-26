import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ListMetadata, ListPreview } from "@/types/database";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function SmsListTab({
  metadata,
  preview,
}: {
  metadata: ListMetadata | null;
  preview: ListPreview | null;
}) {
  const rows = (preview?.rows as Record<string, unknown>[] | undefined) ?? [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : ["Phone_Number", "Full_Name", "Address", "Source_Address"];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>SMS campaign list</CardTitle>
          <CardDescription>
            Campaign-ready cell numbers (built from leads, excluding opt-outs). Used by Send campaign.
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/actions">Build SMS list</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {metadata && (
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">
              Rows: <strong className="text-foreground">{metadata.row_count ?? "—"}</strong>
            </span>
            <span className="text-muted-foreground">
              Last updated: <strong className="text-foreground">{formatDate(metadata.last_updated_at)}</strong>
            </span>
            {metadata.updated_by_job_id && (
              <Link href="/jobs" className="text-primary hover:underline">
                View job
              </Link>
            )}
          </div>
        )}
        {!metadata && (
          <p className="text-muted-foreground text-sm">
            No build yet. Run &quot;Build SMS list&quot; on the Actions page; the worker will update this after a successful run.
          </p>
        )}
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col} className="whitespace-nowrap">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 100).map((row, i) => (
                  <TableRow key={i}>
                    {columns.map((col) => (
                      <TableCell key={col} className="max-w-[200px] truncate text-sm">
                        {String((row as Record<string, unknown>)[col] ?? "—")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {rows.length > 100 && (
              <p className="mt-2 text-muted-foreground text-sm">
                Showing first 100 of {rows.length} rows (preview).
              </p>
            )}
          </div>
        ) : metadata && (
          <p className="text-muted-foreground text-sm">No preview stored yet. Re-run Build SMS list to refresh.</p>
        )}
      </CardContent>
    </Card>
  );
}
