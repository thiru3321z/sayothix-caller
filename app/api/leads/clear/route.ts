// app/api/leads/clear/route.ts
// Wipes all leads (and their associated calls via CASCADE)

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Delete all calls first (FK)
    await supabase.from("calls").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    // Then all leads
    const { error } = await supabase.from("leads").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
