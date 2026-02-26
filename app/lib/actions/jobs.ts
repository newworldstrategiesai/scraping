"use server";

import { getSupabase } from "@/lib/supabase/server";
import type { Job, JobInsert, Json } from "@/types/database";

const JOBS_LIMIT = 50;

export async function getJobs(): Promise<Job[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(JOBS_LIMIT);
  if (error) return [];
  return (data ?? []) as Job[];
}

export async function getJobById(id: string): Promise<Job | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data as Job;
}

export type JobAction =
  | "build_sms_list"
  | "parse_quality_leads"
  | "run_cbc"
  | "send_campaign_dry_run"
  | "send_campaign"
  | "send_warm_lead_message"
  | "send_single_sms";

export async function createJob(
  action: JobAction,
  payload: Record<string, unknown> = {}
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: "Supabase not configured. Set env vars." };
  }
  const insert: JobInsert = {
    action,
    payload: payload as Json,
    status: "pending",
  };
  // Cast: Supabase infers 'never' for insert() when Database types don't match
  const chain = supabase.from("jobs") as unknown as {
    insert: (v: JobInsert) => { select: (c: string) => { single: () => Promise<{ data: { id?: string } | null; error: { message: string } | null }> } };
  };
  const { data, error } = await chain.insert(insert).select("id").single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data?.id };
}
