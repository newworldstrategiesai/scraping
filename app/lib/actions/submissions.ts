"use server";

import { getSupabase } from "@/lib/supabase/server";
import type { FormSubmission, FormSubmissionInsert } from "@/types/database";

export async function getSubmissions(): Promise<FormSubmission[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("form_submissions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as FormSubmission[];
}

export async function submitForm(form: {
  name: string;
  phone: string;
  address?: string;
  email?: string;
  message?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: "Form is temporarily unavailable." };
  }
  const row: FormSubmissionInsert = {
    name: form.name.trim() || null,
    phone: form.phone.trim() || null,
    address: form.address?.trim() || null,
    email: form.email?.trim() || null,
    message: form.message?.trim() || null,
  };
  const { error } = await supabase.from("form_submissions").insert(row as never);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
