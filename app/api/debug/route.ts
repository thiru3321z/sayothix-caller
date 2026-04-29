import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .limit(500);

    if (error) {
      return NextResponse.json({ error: error.message, leads: [] }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ leads: [], debug: "no data" });
    }

    // Custom sort: hot first, then warm, then cold
    const order: Record<string, number> = { hot: 0, warm: 1, cold: 2 };
    const sorted = [...data].sort((a: any, b: any) => {
      const pa = order[a.priority] ?? 3;
      const pb = order[b.priority] ?? 3;
      return pa - pb;
    });

    return NextResponse.json({ leads: sorted, count: sorted.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, leads: [] }, { status: 500 });
  }
}
