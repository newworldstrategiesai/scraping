"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createJob, type JobAction } from "@/lib/actions/jobs";

const ACTIONS: { action: JobAction; label: string; variant?: "default" | "outline" | "destructive" }[] = [
  { action: "build_sms_list", label: "Build SMS list" },
  { action: "parse_quality_leads", label: "Parse quality leads" },
  { action: "run_cbc", label: "Run CBC lookups" },
  { action: "send_campaign_dry_run", label: "Send campaign (dry run)" },
  { action: "send_campaign", label: "Send campaign (for real)", variant: "destructive" },
];

export function ActionButtons({ payload }: { payload: Record<string, unknown> }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function run(action: JobAction) {
    setLoading(action);
    setMessage(null);
    const result = await createJob(action, payload);
    setLoading(null);
    if (result.ok) {
      setMessage({ type: "ok", text: `Job created: ${result.id}. A worker will pick it up.` });
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed to create job." });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map(({ action, label, variant = "outline" }) => (
          <Button
            key={action}
            variant={variant}
            disabled={!!loading}
            onClick={() => run(action)}
          >
            {loading === action ? "Queuing…" : label}
          </Button>
        ))}
      </div>
      {message && (
        <p className={message.type === "error" ? "text-destructive text-sm" : "text-muted-foreground text-sm"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
