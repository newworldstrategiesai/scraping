import Link from "next/link";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getConfig } from "@/lib/actions/config";
import {
  getListMetadata,
  getListPreview,
} from "@/lib/actions/lists";
import { SmsListTab } from "./sms-list-tab";
import { OptOutsTab } from "./opt-outs-tab";
import { WarmLeadsTab } from "./warm-leads-tab";
import { AddressListsTab } from "./address-lists-tab";
import { LeadListsTab } from "./lead-lists-tab";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lists | Lead Automation",
  description: "View and manage address lists, lead lists, SMS list, opt-outs, and warm leads",
};

export default async function ListsPage() {
  const [config, listMetadata, smsPreview] = await Promise.all([
    getConfig(),
    getListMetadata(),
    getListPreview("sms_cell_list"),
  ]);

  const smsMeta = listMetadata.find((m) => m.id === "sms_cell_list") ?? null;

  return (
    <>
      <Nav currentPath="/lists" />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Lists</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/actions">Run actions</Link>
          </Button>
        </div>
        <p className="mb-6 text-muted-foreground text-sm">
          View and manage address lists, lead lists, SMS campaign list, opt-outs, and warm leads.
        </p>
        <Tabs defaultValue="sms" className="space-y-4">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="sms">SMS list</TabsTrigger>
            <TabsTrigger value="opt_outs">Opt-outs</TabsTrigger>
            <TabsTrigger value="warm_leads">Warm leads</TabsTrigger>
            <TabsTrigger value="addresses">Address lists</TabsTrigger>
            <TabsTrigger value="leads">Lead lists</TabsTrigger>
          </TabsList>
          <TabsContent value="sms" className="mt-4">
            <SmsListTab metadata={smsMeta} preview={smsPreview} />
          </TabsContent>
          <TabsContent value="opt_outs" className="mt-4">
            <OptOutsTab />
          </TabsContent>
          <TabsContent value="warm_leads" className="mt-4">
            <WarmLeadsTab />
          </TabsContent>
          <TabsContent value="addresses" className="mt-4">
            <AddressListsTab config={config} />
          </TabsContent>
          <TabsContent value="leads" className="mt-4">
            <LeadListsTab metadata={listMetadata} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
