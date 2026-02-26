"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createJob, type JobAction } from "@/lib/actions/jobs";
import { JobProgress } from "./job-progress";

const ACTIONS: { action: JobAction; label: string; variant?: "default" | "outline" | "destructive" }[] = [
  { action: "build_sms_list", label: "Build SMS list" },
  { action: "parse_quality_leads", label: "Parse quality leads" },
  { action: "run_cbc", label: "Run CBC lookups" },
  { action: "send_campaign_dry_run", label: "Send daily batch (dry run)" },
  { action: "send_campaign", label: "Send daily batch (for real)", variant: "destructive" },
  { action: "send_warm_lead_message", label: "Message warm leads" },
];

export function ActionButtons({ payload }: { payload: Record<string, unknown> }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [activeJob, setActiveJob] = useState<{ id: string; label: string } | null>(null);
  const [showBuildSmsForm, setShowBuildSmsForm] = useState(false);
  const [buildSmsCity, setBuildSmsCity] = useState("");
  const [buildSmsState, setBuildSmsState] = useState("");
  const [buildSmsZip, setBuildSmsZip] = useState("");

  async function run(action: JobAction, extraPayload: Record<string, unknown> = {}) {
    setLoading(action);
    setMessage(null);
    setActiveJob(null);
    const result = await createJob(action, { ...payload, ...extraPayload });
    setLoading(null);
    if (result.ok && result.id) {
      const label = ACTIONS.find((a) => a.action === action)?.label ?? action;
      setActiveJob({ id: result.id, label });
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed to create job." });
    }
  }

  async function runBuildSmsList() {
    setShowBuildSmsForm(false);
    await run("build_sms_list", {
      city: buildSmsCity.trim() || undefined,
      state: buildSmsState.trim() || undefined,
      zip: buildSmsZip.trim() || undefined,
    });
  }

  async function runMessageWarmLeads() {
    setShowMessageWarmLeadsForm(false);
    await run("send_warm_lead_message", { message: warmLeadMessage.trim() || "Thanks for your interest! We'll be in touch shortly." });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map(({ action, label, variant = "outline" }) => (
          <Button
            key={action}
            variant={variant}
            disabled={!!loading}
            onClick={() => {
              if (action === "build_sms_list") setShowBuildSmsForm(true);
              else if (action === "send_warm_lead_message") setShowMessageWarmLeadsForm(true);
              else run(action);
            }}
          >
            {loading === action ? "Queuing…" : label}
          </Button>
        ))}
      </div>

      {showMessageWarmLeadsForm && (
        <Card className="border-muted bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Message warm leads</CardTitle>
            <CardDescription>
              Send one SMS to every warm lead (opted-in contacts). Worker must be running.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="warm_lead_message">Message</Label>
              <Input
                id="warm_lead_message"
                placeholder="Thanks for your interest! We'll be in touch shortly."
                value={warmLeadMessage}
                onChange={(e) => setWarmLeadMessage(e.target.value)}
                maxLength={160}
              />
              <p className="text-muted-foreground text-xs">{warmLeadMessage.length}/160</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => runMessageWarmLeads()} disabled={!!loading}>
                {loading === "send_warm_lead_message" ? "Queuing…" : "Send to all warm leads"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowMessageWarmLeadsForm(false)} disabled={!!loading}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showBuildSmsForm && (
        <Card className="border-muted bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Build SMS list — target area (optional)</CardTitle>
            <CardDescription>
              Leave blank to include all leads, or enter City, State, and/or Zip to filter.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="build_sms_city">City</Label>
                <Input
                  id="build_sms_city"
                  placeholder="e.g. Memphis"
                  value={buildSmsCity}
                  onChange={(e) => setBuildSmsCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="build_sms_state">State</Label>
                <Input
                  id="build_sms_state"
                  placeholder="e.g. TN"
                  value={buildSmsState}
                  onChange={(e) => setBuildSmsState(e.target.value.toUpperCase().slice(0, 2))}
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="build_sms_zip">ZIP code</Label>
                <Input
                  id="build_sms_zip"
                  placeholder="e.g. 38101"
                  value={buildSmsZip}
                  onChange={(e) => setBuildSmsZip(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setLoading("build_sms_list");
                  runBuildSmsList();
                }}
                disabled={!!loading}
              >
                {loading === "build_sms_list" ? "Queuing…" : "Run Build SMS list"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBuildSmsForm(false)}
                disabled={!!loading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeJob && (
        <JobProgress
          jobId={activeJob.id}
          actionLabel={activeJob.label}
          onDismiss={() => setActiveJob(null)}
        />
      )}
      {message && (
        <p className={message.type === "error" ? "text-destructive text-sm" : "text-muted-foreground text-sm"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
