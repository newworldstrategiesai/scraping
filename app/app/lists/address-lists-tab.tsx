import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppConfig } from "@/types/database";

export function AddressListsTab({ config }: { config: AppConfig | null }) {
  const defaultName = config?.addresses_csv_name ?? "propwire_addresses.csv";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Address lists</CardTitle>
        <CardDescription>
          CSV files used as input for CBC lookups. The default list is used when you run &quot;Run CBC lookups&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Default addresses list:</span>
          <code className="rounded bg-muted px-2 py-1 text-sm dark:bg-muted/50">{defaultName}</code>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/settings">Change default (Settings)</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
