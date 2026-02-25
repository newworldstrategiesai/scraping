import { Nav } from "@/components/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getConfig } from "@/lib/actions/config";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const config = await getConfig();

  return (
    <>
      <Nav currentPath="/settings" />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle>Campaign & pipeline</CardTitle>
            <CardDescription>
              These values are used when you run actions (build list, send campaign). A worker reads them from Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm
              defaultValues={{
                company_name: config?.company_name ?? "Tree Service",
                message_template:
                  config?.message_template ??
                  "Hi, {company} here. We're doing tree work in your neighborhood – need any help? Reply YES for a free quote, or STOP to opt out.",
                sms_delay_sec: config?.sms_delay_sec ?? 1,
                include_unknown_phone_type: config?.include_unknown_phone_type ?? true,
                addresses_csv_name: config?.addresses_csv_name ?? "propwire_addresses.csv",
              }}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
