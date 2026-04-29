import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("calls")
      .select(`*, leads (business_name, contact_name, niche)`)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json(
        { calls: [], error: error.message },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const calls = (data || []).map((c: any) => ({
      ...c,
      business_name: c.leads?.business_name,
      contact_name: c.leads?.contact_name,
      niche: c.leads?.niche,
    }));

    return NextResponse.json(
      { calls },
      { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { calls: [], error: err.message },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
