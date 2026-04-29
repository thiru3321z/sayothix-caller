// app/api/call/route.ts
// Triggers an outbound call via Vapi

import { NextRequest, NextResponse } from "next/server";
import { placeOutboundCall } from "@/lib/vapi";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { leadId } = await req.json();

    if (!leadId) {
      return NextResponse.json({ error: "leadId required" }, { status: 400 });
    }

    // Fetch lead from DB
    const { data: lead, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Place the call via Vapi
    const result = await placeOutboundCall({
      phoneNumber: lead.phone,
      businessName: lead.business_name,
      contactName: lead.contact_name,
      niche: lead.niche,
      gaps: lead.gaps || [],
    });

    // Update lead status to 'called'
    await supabase
      .from("leads")
      .update({ status: "called", last_call_id: result.id })
      .eq("id", leadId);

    return NextResponse.json({ success: true, callId: result.id });
  } catch (err: any) {
    console.error("Call error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
