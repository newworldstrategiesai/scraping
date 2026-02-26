"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OptOut } from "@/types/database";
import {
  getOptOuts,
  addOptOut,
  deleteOptOut,
  exportOptOutsCsv,
} from "@/lib/actions/lists";

const PAGE_SIZE = 50;

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function OptOutsTab() {
  const router = useRouter();
  const [rows, setRows] = useState<OptOut[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [addPhone, setAddPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOptOuts(page).then(({ rows: r, total: t }) => {
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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setMessage(null);
    const result = await addOptOut(addPhone.trim(), "Manual");
    setAdding(false);
    if (result.ok) {
      setAddPhone("");
      router.refresh();
      const { rows: r, total: t } = await getOptOuts(page);
      setRows(r);
      setTotal(t);
      setMessage({ type: "ok", text: "Opt-out added." });
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed to add." });
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteOptOut(id);
    if (result.ok) {
      router.refresh();
      const { rows: r, total: t } = await getOptOuts(page);
      setRows(r);
      setTotal(t);
    }
  }

  async function handleExport() {
    setExporting(true);
    const result = await exportOptOutsCsv();
    setExporting(false);
    if (result.ok && result.csv) {
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `opt_outs_${new Date().toISOString().slice(0, 10)}.csv`;
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
          <CardTitle>Opt-outs</CardTitle>
          <CardDescription>
            Phone numbers that have opted out (STOP). Excluded from SMS sends.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
          <div className="space-y-2">
            <Label htmlFor="opt-out-phone">Add opt-out (phone)</Label>
            <Input
              id="opt-out-phone"
              type="tel"
              placeholder="5551234567"
              value={addPhone}
              onChange={(e) => setAddPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
          </div>
          <Button type="submit" size="sm" disabled={adding}>
            {adding ? "Adding…" : "Add"}
          </Button>
        </form>
        {message && (
          <p
            className={
              message.type === "error" ? "text-destructive text-sm" : "text-muted-foreground text-sm"
            }
          >
            {message.text}
          </p>
        )}
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No opt-outs yet.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-sm">{row.phone_number}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(row.date)}
                    </TableCell>
                    <TableCell className="text-sm">{row.source ?? "—"}</TableCell>
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
