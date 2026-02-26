"use server";

import { getSupabase } from "@/lib/supabase/server";
import type {
  OptOut,
  OptOutInsert,
  WarmLead,
  WarmLeadInsert,
  ListMetadata,
  ListPreview,
  SmsCellListRow,
} from "@/types/database";

const PAGE_SIZE = 50;

export async function getListMetadata(): Promise<ListMetadata[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("list_metadata")
    .select("*")
    .order("list_type");
  if (error) return [];
  return (data ?? []) as ListMetadata[];
}

export async function getListPreview(listId: string): Promise<ListPreview | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("list_preview")
    .select("*")
    .eq("list_id", listId)
    .single();
  if (error || !data) return null;
  return data as ListPreview;
}

export async function getSmsCellListRows(page = 0): Promise<{ rows: SmsCellListRow[]; total: number }> {
  const supabase = getSupabase();
  if (!supabase) return { rows: [], total: 0 };
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const [countRes, dataRes] = await Promise.all([
    supabase.from("sms_cell_list_rows").select("id", { count: "exact", head: true }),
    supabase.from("sms_cell_list_rows").select("*").order("created_at", { ascending: false }).range(from, to),
  ]);
  const total = countRes.count ?? 0;
  const rows = (dataRes.data ?? []) as SmsCellListRow[];
  return { rows, total };
}

export async function getOptOuts(page = 0): Promise<{ rows: OptOut[]; total: number }> {
  const supabase = getSupabase();
  if (!supabase) return { rows: [], total: 0 };
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const [countRes, dataRes] = await Promise.all([
    supabase.from("opt_outs").select("id", { count: "exact", head: true }),
    supabase.from("opt_outs").select("*").order("date", { ascending: false }).range(from, to),
  ]);
  const total = countRes.count ?? 0;
  const rows = (dataRes.data ?? []) as OptOut[];
  return { rows, total };
}

export async function getWarmLeads(page = 0): Promise<{ rows: WarmLead[]; total: number }> {
  const supabase = getSupabase();
  if (!supabase) return { rows: [], total: 0 };
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const [countRes, dataRes] = await Promise.all([
    supabase.from("warm_leads").select("id", { count: "exact", head: true }),
    supabase.from("warm_leads").select("*").order("reply_time", { ascending: false }).range(from, to),
  ]);
  const total = countRes.count ?? 0;
  const rows = (dataRes.data ?? []) as WarmLead[];
  return { rows, total };
}

export async function addOptOut(phone: string, source = "Manual"): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Not configured." };
  const normalized = phone.replace(/\D/g, "").slice(-10);
  if (normalized.length < 10) return { ok: false, error: "Enter a valid 10-digit phone number." };
  const insert: OptOutInsert = { phone_number: normalized, source };
  const { error } = await supabase.from("opt_outs").insert(insert as never);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteOptOut(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Not configured." };
  const { error } = await supabase.from("opt_outs").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteWarmLead(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Not configured." };
  const { error } = await supabase.from("warm_leads").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function exportOptOutsCsv(): Promise<{ ok: boolean; csv?: string; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Not configured." };
  const { data, error } = await supabase
    .from("opt_outs")
    .select("phone_number, date, source")
    .order("date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  const rows = (data ?? []) as { phone_number: string; date: string | null; source: string | null }[];
  const header = "Phone_Number,Date,Source";
  const lines = rows.map((r) =>
    [r.phone_number, r.date ?? "", (r.source ?? "").replace(/"/g, '""')].map((c) => `"${c}"`).join(",")
  );
  const csv = [header, ...lines].join("\n");
  return { ok: true, csv };
}

export async function exportWarmLeadsCsv(): Promise<{ ok: boolean; csv?: string; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Not configured." };
  const { data, error } = await supabase
    .from("warm_leads")
    .select("phone_number, full_name, address, first_reply_text, reply_time, source_campaign")
    .order("reply_time", { ascending: false });
  if (error) return { ok: false, error: error.message };
  const rows = (data ?? []) as {
    phone_number: string;
    full_name: string | null;
    address: string | null;
    first_reply_text: string | null;
    reply_time: string | null;
    source_campaign: string | null;
  }[];
  const header = "Phone_Number,Full_Name,Address,First_Reply_Text,Reply_Time,Source_Campaign";
  const escape = (v: string | null) => (v ?? "").replace(/"/g, '""');
  const lines = rows.map((r) =>
    [
      r.phone_number,
      escape(r.full_name),
      escape(r.address),
      escape(r.first_reply_text),
      r.reply_time ?? "",
      escape(r.source_campaign),
    ]
      .map((c) => `"${c}"`)
      .join(",")
  );
  const csv = [header, ...lines].join("\n");
  return { ok: true, csv };
}
