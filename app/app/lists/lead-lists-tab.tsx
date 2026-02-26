import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ListMetadata } from "@/types/database";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function LeadListsTab({ metadata }: { metadata: ListMetadata[] }) {
  const leadsMeta = metadata.filter((m) => m.list_type === "leads");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead lists</CardTitle>
        <CardDescription>
          CBC output and quality shortlist. Run CBC lookups or Parse quality leads on the Actions page to update.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {leadsMeta.length === 0 ? (
          <p className="text-muted-foreground text-sm">No lead list metadata yet.</p>
        ) : (
          <ul className="space-y-3">
            {leadsMeta.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 dark:bg-muted/20"
              >
                <div>
                  <span className="font-medium">{m.name}</span>
                  <span className="ml-2 text-muted-foreground text-sm">
                    ({m.source_identifier ?? m.id})
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Rows: <strong className="text-foreground">{m.row_count ?? "—"}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Updated: {formatDate(m.last_updated_at)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button asChild variant="outline" size="sm">
          <Link href="/actions">Run CBC / Parse quality leads</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
