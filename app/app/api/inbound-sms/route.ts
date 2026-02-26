import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/utils/phone";

const OPT_OUT_REGEX = /\b(stop|unsubscribe|cancel|opt\s*out|remove)\b/i;
const INTEREST_REGEX = /\b(yes|sure|interested|quote|help|call\s*me|please)\b/i;
const SOURCE_CAMPAIGN = "SMS-neighborhood";

const TWIML_OPT_OUT =
  '<?xml version="1.0" encoding="UTF-8"?><Response><Message>You\'re unsubscribed. We won\'t text again.</Message></Response>';
const TWIML_WARM_LEAD =
  '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Thanks! We\'ll call you shortly.</Message></Response>';

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    console.error("[inbound-sms] Supabase not configured");
    return new NextResponse("Service unavailable", { status: 503 });
  }

  let from = "";
  let body = "";
  try {
    const formData = await request.formData();
    from = (formData.get("From") as string) ?? "";
    body = (formData.get("Body") as string) ?? "";
  } catch {
    from = "";
    body = "";
  }

  const phone = normalizePhone(from);
  if (!phone || phone.length !== 10) {
    return new NextResponse("Invalid phone", { status: 400 });
  }

  const bodyClean = (body || "").trim();

  if (OPT_OUT_REGEX.test(bodyClean)) {
    const { error } = await supabase.from("opt_outs").insert({
      phone_number: phone,
      source: "SMS reply",
    });
    if (error) console.error("[inbound-sms] opt_outs insert error:", error);
    return new NextResponse(TWIML_OPT_OUT, {
      headers: { "Content-Type": "application/xml" },
    });
  }

  if (INTEREST_REGEX.test(bodyClean)) {
    const { data: existing } = await supabase
      .from("warm_leads")
      .select("id")
      .eq("phone_number", phone)
      .limit(1)
      .maybeSingle();
    if (!existing) {
      const { error } = await supabase.from("warm_leads").insert({
        phone_number: phone,
        first_reply_text: bodyClean.slice(0, 500),
        source_campaign: SOURCE_CAMPAIGN,
      });
      if (error) console.error("[inbound-sms] warm_leads insert error:", error);
    }
    return new NextResponse(TWIML_WARM_LEAD, {
      headers: { "Content-Type": "application/xml" },
    });
  }

  return new NextResponse("", { status: 200 });
}

export async function GET() {
  return new NextResponse("ok", { status: 200 });
}
