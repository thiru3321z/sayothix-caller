import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const toolCall = payload?.message?.toolCalls?.[0];
    const args = toolCall?.function?.arguments || {};
    const customerNumber = payload.message.call?.customer?.number;

    const updates: any = {};
    if (args.person_in_charge_name) updates.contact_name = args.person_in_charge_name;
    if (args.contact_phone) updates.direct_contact_phone = args.contact_phone;
    if (args.notes) updates.analysis_notes = args.notes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        results: [{ toolCallId: toolCall.id, result: "No info to update" }],
      });
    }

    await supabase
      .from("leads")
      .update(updates)
      .eq("phone", customerNumber);

    return NextResponse.json({
      results: [{ toolCallId: toolCall.id, result: "Contact info updated" }],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
