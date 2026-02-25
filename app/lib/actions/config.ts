"use server";

import { getSupabase } from "@/lib/supabase/server";
import type { AppConfig } from "@/types/database";

const CONFIG_ID = "default";

export async function getConfig(): Promise<AppConfig | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("app_config")
    .select("*")
    .eq("id", CONFIG_ID)
    .single();
  if (error || !data) return null;
  return data as AppConfig;
}

export type ConfigForm = {
  company_name: string;
  message_template: string;
  sms_delay_sec: number;
  include_unknown_phone_type: boolean;
  addresses_csv_name: string;
};

export async function saveConfig(form: ConfigForm): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: "Supabase not configured. Set env vars." };
  }
  const update = {
    company_name: form.company_name,
    message_template: form.message_template,
    sms_delay_sec: form.sms_delay_sec,
    include_unknown_phone_type: form.include_unknown_phone_type,
    addresses_csv_name: form.addresses_csv_name,
    updated_at: new Date().toISOString(),
  };
  // Cast needed: Supabase infers 'never' for update() when Database types don't match
  const { error } = await (supabase.from("app_config") as unknown as { update: (u: typeof update) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> } })
    .update(update)
    .eq("id", CONFIG_ID);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
