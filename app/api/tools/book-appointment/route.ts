import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendAppointmentWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const toolCall = payload?.message?.toolCalls?.[0];
    const args = toolCall?.function?.arguments || {};

    const customerNumber = payload.message.call?.customer?.number;

    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("phone", customerNumber)
      .single();

    if (!lead) {
      return NextResponse.json({
        results: [{ toolCallId: toolCall.id, result: "Lead not found" }],
      });
    }

    await sendAppointmentWhatsApp({
      businessName: lead.business_name,
      contactName: args.contact_name,
      contactPhone: args.whatsapp_number,
      niche: lead.niche,
      meetingTime: args.meeting_time,
      meetLink: "https://meet.google.com/new", // TODO: real link in #4
    });

    await supabase.from("leads").update({ status: "appointment" }).eq("id", lead.id);

    return NextResponse.json({
      results: [
        {
          toolCallId: toolCall.id,
          result: "Appointment booked. WhatsApp sent.",
        },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
