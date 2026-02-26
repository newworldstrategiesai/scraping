"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import type { WarmLead } from "@/types/database";
import Link from "next/link";
import {
  getWarmLeads,
  deleteWarmLead,
  exportWarmLeadsCsv,
} from "@/lib/actions/lists";
import { normalizePhone } from "@/lib/utils/phone";

const PAGE_SIZE = 50;

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function WarmLeadsTab() {
  const router = useRouter();
  const [rows, setRows] = useState<WarmLead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getWarmLeads(page).then(({ rows: r, total: t }) => {
      if (!cancelled) {
        setRows(r);
        setTotal(t);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [page]);

  async function handleDelete(id: string) {
    const result = await deleteWarmLead(id);
    if (result.ok) {
      router.refresh();
      const { rows: r, total: t } = await getWarmLeads(page);
      setRows(r);
      setTotal(t);
    }
  }

  async function handleExport() {
    setExporting(true);
    setMessage(null);
    const result = await exportWarmLeadsCsv();
    setExporting(false);
    if (result.ok && result.csv) {
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `warm_leads_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      setMessage({ type: "error", text: result.error ?? "Export failed." });
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Warm leads</CardTitle>
          <CardDescription>
            People who replied YES to a campaign. Follow up for quotes.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <p className="text-destructive text-sm">{message.text}</p>
        )}
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No warm leads yet.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Reply</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-sm">
                      <Link
                        href={`/lists/contact/${normalizePhone(row.phone_number)}`}
                        className="text-primary hover:underline"
                      >
                        {row.phone_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{row.full_name ?? "—"}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">
                      {row.address ? (
                        <Link
                          href={`/lists/contact/${normalizePhone(row.phone_number)}`}
                          className="text-primary hover:underline"
                        >
                          {row.address}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate text-sm">
                      {row.first_reply_text ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(row.reply_time)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(row.id)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-sm">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-muted-foreground">
                  Page {page + 1} of {totalPages} ({total} total)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
