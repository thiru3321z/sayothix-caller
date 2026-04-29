// app/api/call/next/route.ts
// Auto-picks the next lead to call: hot first, then warm. Skips cold.
// POST this from the dashboard to start a "call queue"

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { placeOutboundCall } from "@/lib/vapi";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Find next pending lead — hot priority first, then warm. Skip cold entirely.
    const { data: hotLeads } = await supabase
      .from("leads")
      .select("*")
      .eq("status", "pending")
      .eq("priority", "hot")
      .limit(1);

    let lead = hotLeads?.[0];

    if (!lead) {
      const { data: warmLeads } = await supabase
        .from("leads")
        .select("*")
        .eq("status", "pending")
        .eq("priority", "warm")
        .limit(1);
      lead = warmLeads?.[0];
    }

    if (!lead) {
      return NextResponse.json({
        success: false,
        message: "No pending hot or warm leads. All done!",
      });
    }

    // Place the call
    const result = await placeOutboundCall({
      phoneNumber: lead.phone,
      businessName: lead.business_name,
      contactName: lead.contact_name || "",
      niche: lead.niche,
      gaps: lead.gaps || [],
    });

    await supabase
      .from("leads")
      .update({ status: "called", last_call_id: result.id })
      .eq("id", lead.id);

    return NextResponse.json({
      success: true,
      callId: result.id,
      lead: {
        business_name: lead.business_name,
        priority: lead.priority,
        phone: lead.phone,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
