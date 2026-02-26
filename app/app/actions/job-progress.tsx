"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getJobById } from "@/lib/actions/jobs";
import type { Job } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 2000;

const statusStep = (status: Job["status"]) => {
  switch (status) {
    case "pending":
      return { step: 1, label: "Queued — waiting for worker" };
    case "running":
      return { step: 2, label: "Running" };
    case "success":
      return { step: 3, label: "Done" };
    case "failed":
      return { step: 3, label: "Failed" };
    default:
      return { step: 0, label: status };
  }
};

export function JobProgress({
  jobId,
  actionLabel,
  onDismiss,
}: {
  jobId: string;
  actionLabel: string;
  onDismiss: () => void;
}) {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      const data = await getJobById(jobId);
      if (cancelled) return;
      if (data) {
        setJob(data);
        setError(null);
        if (data.status === "success" || data.status === "failed") {
          if (intervalId) clearInterval(intervalId);
          intervalId = null;
        }
      } else {
        setError("Could not load job status.");
      }
    }

    poll();
    intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [job?.log, job?.error]);

  const terminal = job && (job.status === "success" || job.status === "failed");
  const { step, label } = job ? statusStep(job.status) : { step: 0, label: "Loading…" };
  const logText = job?.log ?? "";
  const errText = job?.error ?? "";

  return (
    <Card className="border-primary/20 bg-muted/30 dark:bg-muted/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          {actionLabel}
        </CardTitle>
        <div className="flex items-center gap-3">
          {/* Step indicators */}
          <div className="flex items-center gap-1.5 text-sm">
            <StepDot active={step >= 1} done={step > 1} label="Queued" />
            <StepLine done={step > 1} />
            <StepDot active={step >= 2} done={step > 2} label="Running" />
            <StepLine done={step > 2} />
            <StepDot active={step >= 3} done={step >= 3 && job?.status === "success"} failed={job?.status === "failed"} label={terminal ? (job?.status === "success" ? "Done" : "Failed") : "Done"} />
          </div>
          <span className="text-muted-foreground text-sm">{label}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          {!terminal ? (
            <div className="h-full w-[40%] animate-pulse rounded-full bg-primary/70" />
          ) : (
            <div
              className={`h-full w-full rounded-full ${job?.status === "success" ? "bg-green-500 dark:bg-green-600" : "bg-destructive"}`}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {(logText || errText) ? (
          <div className="max-h-48 overflow-auto rounded-md border bg-background p-3 font-mono text-xs">
            {logText && (
              <pre className="whitespace-pre-wrap break-words text-foreground">
                {job?.action === "build_sms_list" && logText.includes("sms_cell_list.csv")
                  ? logText.split("sms_cell_list.csv").map((part, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && (
                          <Link href="/lists?tab=sms" className="font-medium text-primary underline hover:no-underline">
                            sms_cell_list.csv
                          </Link>
                        )}
                        {part}
                      </React.Fragment>
                    ))
                  : logText}
              </pre>
            )}
            {errText && <pre className="whitespace-pre-wrap break-words text-destructive">{errText}</pre>}
            <div ref={logEndRef} />
          </div>
        ) : (
          !terminal && <p className="text-muted-foreground text-sm">Waiting for worker… Log will appear when the job runs.</p>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {terminal && (
          <div className="flex flex-wrap gap-2">
            {job?.action === "build_sms_list" && (
              <Button asChild variant="default" size="sm">
                <Link href="/lists?tab=sms">View SMS list</Link>
              </Button>
            )}
            {job?.action === "parse_quality_leads" && (
              <Button asChild variant="default" size="sm">
                <Link href="/lists?tab=leads">View lead lists</Link>
              </Button>
            )}
            {job?.action === "run_cbc" && (
              <Button asChild variant="default" size="sm">
                <Link href="/lists?tab=leads">View lead lists</Link>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StepDot({
  active,
  done,
  failed,
  label,
}: {
  active: boolean;
  done?: boolean;
  failed?: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex h-2 w-2 rounded-full ${
        failed ? "bg-destructive" : done ? "bg-green-500 dark:bg-green-600" : active ? "bg-primary animate-pulse" : "bg-muted"
      }`}
      title={label}
      aria-label={label}
    />
  );
}

function StepLine({ done }: { done: boolean }) {
  return <span className={`h-px w-4 ${done ? "bg-primary" : "bg-muted"}`} />;
}
