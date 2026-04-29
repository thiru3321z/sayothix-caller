// app/api/debug/route.ts
// Returns info about which Supabase project Vercel is actually connecting to
// VISIT: https://YOUR_DOMAIN/api/debug

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const keyPresent = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const keyPreview = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) + "...";

  // Try to count leads
  let leadCount = null;
  let queryError = null;
  try {
    const { count, error } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true });
    if (error) queryError = error.message;
    else leadCount = count;
  } catch (e: any) {
    queryError = e.message;
  }

  // Try to fetch raw data
  let firstLead = null;
  try {
    const { data } = await supabase.from("leads").select("business_name, priority").limit(1);
    firstLead = data?.[0] || null;
  } catch (e: any) { /* ignore */ }

  return NextResponse.json({
    supabase_url: url,
    service_key_present: keyPresent,
    service_key_preview: keyPreview,
    lead_count_from_query: leadCount,
    query_error: queryError,
    first_lead_sample: firstLead,
    timestamp: new Date().toISOString(),
  });
}
