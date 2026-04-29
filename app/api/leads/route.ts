// app/api/leads/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabase.from("leads").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const order: Record<string, number> = { hot: 0, warm: 1, cold: 2 };
  const sorted = (data || []).sort((a: any, b: any) => {
    const pa = order[a.priority] ?? 3;
    const pb = order[b.priority] ?? 3;
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return NextResponse.json({ leads: sorted });
}
