import { Nav } from "@/components/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getConfig } from "@/lib/actions/config";
import { ActionButtons } from "./action-buttons";

export default async function ActionsPage() {
  const config = await getConfig();

  return (
    <>
      <Nav currentPath="/actions" />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Actions</h1>
        <Card>
          <CardHeader>
            <CardTitle>Run pipeline steps</CardTitle>
            <CardDescription>
              Each action creates a job in the queue. A worker (your machine or server) must be running to pick up and execute jobs. Until then, jobs stay pending.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActionButtons
              payload={{
                company_name: config?.company_name ?? "Tree Service",
                message_template: config?.message_template ?? "",
                sms_delay_sec: config?.sms_delay_sec ?? 1,
                include_unknown_phone_type: config?.include_unknown_phone_type ?? true,
                addresses_csv_name: config?.addresses_csv_name ?? "propwire_addresses.csv",
                daily_batch_limit: 450,
              }}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
