import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
 
export const dynamic = "force-dynamic";
export const revalidate = 0;
 
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .limit(1000);
 
    if (error) {
      return NextResponse.json(
        { leads: [], error: error.message },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }
 
    const order: Record<string, number> = { hot: 0, warm: 1, cold: 2 };
    const sorted = (data || []).sort((a: any, b: any) => {
      const pa = order[a.priority] ?? 3;
      const pb = order[b.priority] ?? 3;
      return pa - pb;
    });
 
    return NextResponse.json(
      { leads: sorted, count: sorted.length },
      { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { leads: [], error: err.message },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
