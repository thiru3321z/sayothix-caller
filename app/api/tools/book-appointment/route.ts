// app/api/tools/book-appointment/route.ts
// Vapi calls this when Isabell triggers the book_appointment tool

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { sendAppointmentWhatsApp } from "../../../../lib/whatsapp";
import { createMeetEvent } from "../../../../lib/google-calendar";

export const dynamic = "force-dynamic";

async function parseToISO(naturalTime: string): Promise<string | null> {
  try {
    const now = new Date().toISOString();
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        system: `Convert natural language times to ISO 8601. Current time: ${now}. Timezone: Asia/Kuala_Lumpur (+08:00). Return ONLY the ISO string, nothing else. If unclear, return "null".`,
        messages: [{ role: "user", content: naturalTime }],
      }),
    });
    const data = await res.json();
    const result = data.content?.[0]?.text?.trim();
    return result && result !== "null" ? result : null;
  } catch (err) {
    console.error("parseToISO failed:", err);
    return null;
  }
}

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
        results: [{ toolCallId: toolCall?.id, result: "Lead not found" }],
      });
    }

    const isoTime = await parseToISO(args.meeting_time);

    let meetLink = "https://meet.google.com/new";
    let calendarEventId: string | null = null;

    if (isoTime) {
      try {
        const startDate = new Date(isoTime);
        const endDate = new Date(startDate.getTime() + 15 * 60 * 1000);

        const event = await createMeetEvent({
          summary: `Sayothix x ${lead.business_name}`,
          description: `15-min discovery call with ${args.contact_name}.\n\nNiche: ${lead.niche}\nWhatsApp: ${args.whatsapp_number}\nPhone: ${lead.phone}`,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        });

        meetLink = event.meetLink || meetLink;
        calendarEventId = event.eventId || null;
      } catch (err) {
        console.error("Calendar event creation failed:", err);
      }
    }

    await sendAppointmentWhatsApp({
      businessName: lead.business_name,
      contactName: args.contact_name || lead.contact_name,
      contactPhone: args.whatsapp_number || lead.phone,
      niche: lead.niche,
      meetingTime: args.meeting_time,
      meetLink: meetLink,
    });

    await supabase.from("appointments").insert({
      lead_id: lead.id,
      meeting_time_text: args.meeting_time,
      meeting_time_iso: isoTime,
      contact_name: args.contact_name,
      whatsapp_number: args.whatsapp_number,
      platform: args.platform || "google_meet",
      meet_link: meetLink,
      calendar_event_id: calendarEventId,
    });

    await supabase
      .from("leads")
      .update({ status: "appointment" })
      .eq("id", lead.id);

    return NextResponse.json({
      results: [{ toolCallId: toolCall.id, result: "Appointment booked." }],
    });
  } catch (err: any) {
    console.error("book-appointment error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
