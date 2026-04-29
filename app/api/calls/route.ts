// app/api/calls/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  // Join calls with lead info for display
  const { data, error } = await supabase
    .from("calls")
    .select(`
      *,
      leads (business_name, contact_name, niche)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten the joined data
  const calls = (data || []).map((c: any) => ({
    ...c,
    business_name: c.leads?.business_name,
    contact_name: c.leads?.contact_name,
    niche: c.leads?.niche,
  }));

  return NextResponse.json({ calls });
}
