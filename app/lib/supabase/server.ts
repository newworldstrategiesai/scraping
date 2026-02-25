import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.warn(
    "Supabase env missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. UI will show placeholders."
  );
}

export function getSupabase() {
  if (!url || !serviceRoleKey) {
    return null;
  }
  return createClient<Database>(url, serviceRoleKey, { auth: { persistSession: false } });
}
