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
import type { ListMetadata, ListPreview, SmsCellListRow } from "@/types/database";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

const SUPABASE_COLUMNS: { key: keyof SmsCellListRow; label: string }[] = [
  { key: "phone_number", label: "Phone" },
  { key: "full_name", label: "Name" },
  { key: "address", label: "Address" },
  { key: "source_address", label: "Source address" },
  { key: "lead_type", label: "Lead type" },
  { key: "resident_type", label: "Resident type" },
];

export function SmsListTab({
  metadata,
  preview,
  supabaseRows = [],
  totalRows = 0,
}: {
  metadata: ListMetadata | null;
  preview: ListPreview | null;
  supabaseRows?: SmsCellListRow[];
  totalRows?: number;
}) {
  const useSupabase = supabaseRows.length > 0;
  const previewRows = (preview?.rows as Record<string, unknown>[] | undefined) ?? [];
  const previewColumns = previewRows.length > 0 ? Object.keys(previewRows[0]) : ["Phone_Number", "Full_Name", "Address", "Source_Address"];
  const rows = useSupabase ? supabaseRows : previewRows;
  const columns = useSupabase ? SUPABASE_COLUMNS.map((c) => c.key) : previewColumns;
  const columnLabels = useSupabase ? SUPABASE_COLUMNS.map((c) => c.label) : columns;

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
              Rows: <strong className="text-foreground">{useSupabase ? totalRows : (metadata.row_count ?? "—")}</strong>
              {useSupabase && " (from Supabase)"}
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
                  {(useSupabase ? columnLabels : columns).map((label, i) => (
                    <TableHead key={columns[i]} className="whitespace-nowrap">
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 100).map((row, i) => (
                  <TableRow key={useSupabase ? (row as SmsCellListRow).id : i}>
                    {columns.map((col) => (
                      <TableCell key={col} className="max-w-[200px] truncate text-sm">
                        {useSupabase
                          ? String((row as SmsCellListRow)[col as keyof SmsCellListRow] ?? "—")
                          : String((row as Record<string, unknown>)[col] ?? "—")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(useSupabase ? totalRows : rows.length) > 100 && (
              <p className="mt-2 text-muted-foreground text-sm">
                Showing first 100 of {useSupabase ? totalRows : rows.length} rows{useSupabase ? " (from Supabase)" : " (preview)"}.
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
