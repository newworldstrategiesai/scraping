"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveConfig, type ConfigForm } from "@/lib/actions/config";

export function SettingsForm({ defaultValues }: { defaultValues: ConfigForm }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const form = e.currentTarget;
    const formData: ConfigForm = {
      company_name: (form.querySelector('[name="company_name"]') as HTMLInputElement).value,
      message_template: (form.querySelector('[name="message_template"]') as HTMLInputElement).value,
      sms_delay_sec: Number((form.querySelector('[name="sms_delay_sec"]') as HTMLInputElement).value) || 1,
      include_unknown_phone_type: (form.querySelector('[name="include_unknown_phone_type"]') as HTMLInputElement).checked,
      addresses_csv_name: (form.querySelector('[name="addresses_csv_name"]') as HTMLInputElement).value,
    };
    const result = await saveConfig(formData);
    setSaving(false);
    if (result.ok) {
      setMessage({ type: "ok", text: "Saved." });
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed to save." });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="company_name">Company name</Label>
        <Input
          id="company_name"
          name="company_name"
          defaultValue={defaultValues.company_name}
          placeholder="Tree Service"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message_template">SMS message template (use {"{company}"})</Label>
        <textarea
          id="message_template"
          name="message_template"
          defaultValue={defaultValues.message_template}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sms_delay_sec">Delay between SMS (seconds)</Label>
        <Input
          id="sms_delay_sec"
          name="sms_delay_sec"
          type="number"
          min={0.5}
          step={0.5}
          defaultValue={defaultValues.sms_delay_sec}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="include_unknown_phone_type"
          name="include_unknown_phone_type"
          defaultChecked={defaultValues.include_unknown_phone_type}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="include_unknown_phone_type">Include unknown phone type in SMS list</Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="addresses_csv_name">Addresses CSV name (for CBC)</Label>
        <Input
          id="addresses_csv_name"
          name="addresses_csv_name"
          defaultValue={defaultValues.addresses_csv_name}
          placeholder="propwire_addresses.csv"
        />
      </div>
      {message && (
        <p className={message.type === "error" ? "text-destructive text-sm" : "text-muted-foreground text-sm"}>
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
