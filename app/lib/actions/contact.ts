"use server";

import { getSupabase } from "@/lib/supabase/server";
import type {
  OptOut,
  WarmLead,
  FormSubmission,
  ContactNote,
  ContactNoteInsert,
} from "@/types/database";

function normalizePhone(phone: string | null | undefined): string {
  if (phone == null) return "";
  return String(phone).replace(/\D/g, "").slice(-10);
}

export type ContactData = {
  phone: string;
  optOuts: OptOut[];
  warmLeads: WarmLead[];
  formSubmissions: FormSubmission[];
  notes: ContactNote[];
  displayName: string | null;
  displayAddress: string | null;
};

export async function getContactByPhone(phoneRaw: string): Promise<ContactData | null> {
  const phone = normalizePhone(phoneRaw);
  if (phone.length < 10) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const [optRes, warmRes, formRes, notesRes] = await Promise.all([
    supabase.from("opt_outs").select("*").eq("phone_number", phone).order("date", { ascending: false }),
    supabase.from("warm_leads").select("*").eq("phone_number", phone).order("reply_time", { ascending: false }),
    supabase.from("form_submissions").select("*").not("phone", "is", null).order("created_at", { ascending: false }).limit(500),
    supabase.from("contact_notes").select("*").eq("phone_number", phone).order("created_at", { ascending: false }),
  ]);

  const optOuts = (optRes.data ?? []) as OptOut[];
  const warmLeads = (warmRes.data ?? []) as WarmLead[];
  const formSubmissions = ((formRes.data ?? []) as FormSubmission[]).filter((r) => normalizePhone(r.phone) === phone);
  const notes = (notesRes.data ?? []) as ContactNote[];

  const displayName =
    warmLeads[0]?.full_name?.trim() ||
    formSubmissions[0]?.name?.trim() ||
    null;
  const displayAddress =
    warmLeads[0]?.address?.trim() ||
    formSubmissions[0]?.address?.trim() ||
    null;

  return {
    phone,
    optOuts,
    warmLeads,
    formSubmissions,
    notes,
    displayName,
    displayAddress,
  };
}

export async function getContactNotes(phone: string): Promise<ContactNote[]> {
  const normalized = normalizePhone(phone);
  if (normalized.length < 10) return [];
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("contact_notes")
    .select("*")
    .eq("phone_number", normalized)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as ContactNote[];
}

export async function addContactNote(phone: string, note: string): Promise<{ ok: boolean; error?: string }> {
  const normalized = normalizePhone(phone);
  if (normalized.length < 10) return { ok: false, error: "Invalid phone." };
  const trimmed = note.trim();
  if (!trimmed) return { ok: false, error: "Note is required." };
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Not configured." };
  const insert: ContactNoteInsert = { phone_number: normalized, note: trimmed };
  const { error } = await supabase.from("contact_notes").insert(insert as never);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteContactNote(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Not configured." };
  const { error } = await supabase.from("contact_notes").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateContactNote(id: string, note: string): Promise<{ ok: boolean; error?: string }> {
  const trimmed = note.trim();
  if (!trimmed) return { ok: false, error: "Note is required." };
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Not configured." };
  const { error } = await supabase.from("contact_notes").update({ note: trimmed }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateOptOut(
  id: string,
  data: { phone_number?: string; source?: string }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Not configured." };
  const update: Record<string, string> = {};
  if (data.phone_number != null) {
    const p = normalizePhone(data.phone_number);
    if (p.length < 10) return { ok: false, error: "Invalid phone." };
    update.phone_number = p;
  }
  if (data.source != null) update.source = data.source;
  if (Object.keys(update).length === 0) return { ok: true };
  const { error } = await supabase.from("opt_outs").update(update).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateWarmLead(
  id: string,
  data: {
    phone_number?: string;
    full_name?: string | null;
    address?: string | null;
    first_reply_text?: string | null;
    source_campaign?: string | null;
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Not configured." };
  const update: Record<string, string | null> = {};
  if (data.phone_number != null) {
    const p = normalizePhone(data.phone_number);
    if (p.length < 10) return { ok: false, error: "Invalid phone." };
    update.phone_number = p;
  }
  if (data.full_name !== undefined) update.full_name = data.full_name;
  if (data.address !== undefined) update.address = data.address;
  if (data.first_reply_text !== undefined) update.first_reply_text = data.first_reply_text;
  if (data.source_campaign !== undefined) update.source_campaign = data.source_campaign;
  if (Object.keys(update).length === 0) return { ok: true };
  const { error } = await supabase.from("warm_leads").update(update).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getFormSubmissionsByPhone(phone: string): Promise<FormSubmission[]> {
  const normalized = normalizePhone(phone);
  if (normalized.length < 10) return [];
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("form_submissions")
    .select("*")
    .or(`phone.eq.${normalized},phone.ilike.%${normalized}`)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as FormSubmission[];
}

export async function updateFormSubmission(
  id: string,
  data: { name?: string | null; phone?: string | null; address?: string | null; email?: string | null; message?: string | null }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Not configured." };
  const update: Record<string, string | null> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.phone !== undefined) update.phone = data.phone;
  if (data.address !== undefined) update.address = data.address;
  if (data.email !== undefined) update.email = data.email;
  if (data.message !== undefined) update.message = data.message;
  if (Object.keys(update).length === 0) return { ok: true };
  const { error } = await supabase.from("form_submissions").update(update).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteFormSubmission(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Not configured." };
  const { error } = await supabase.from("form_submissions").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
