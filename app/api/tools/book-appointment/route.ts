// app/api/tools/book-appointment/route.ts
// Vapi calls this when Isabell triggers the book_appointment tool

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendAppointmentWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// Convert natural language time → ISO 8601 using GPT-4o-mini
async function parseToISO(naturalTime: string): Promise<string | null> {
  try {
    const now = new Date().toISOString();
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Convert natural language times to ISO 8601. Current time: ${now}. Timezone: Asia/Kuala_Lumpur (+08:00). Return ONLY the ISO string, nothing else. If unclear, return "null".`,
          },
          { role: "user", content: naturalTime },
        ],
        temperature: 0,
      }),
    });
    const data = await res.json();
    const result = data.choices?.[0]?.message?.content?.trim();
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

    // Find lead
    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("phone", customerNumber)
      .single();

    if (!lead) {
      console.warn("No lead found for", customerNumber);
      return NextResponse.json({
        results: [
          {
            toolCallId: toolCall?.id,
            result: "Lead not found",
          },
        ],
      });
    }

    // Parse meeting time to ISO
    const isoTime = await parseToISO(args.meeting_time);

    // Send WhatsApp notification to owner
    await sendAppointmentWhatsApp({
      businessName: lead.business_name,
      contactName: args.contact_name || lead.contact_name,
      contactPhone: args.whatsapp_number || lead.phone,
      niche: lead.niche,
      meetingTime: args.meeting_time, // human-readable
      meetLink: "https://meet.google.com/new", // TODO: real link in #4
    });

    // Save appointment to DB
    await supabase.from("appointments").insert({
      lead_id: lead.id,
      meeting_time_text: args.meeting_time,
      meeting_time_iso: isoTime,
      contact_name: args.contact_name,
      whatsapp_number: args.whatsapp_number,
      platform: args.platform || "google_meet",
    });

    // Update lead status
    await supabase
      .from("leads")
      .update({ status: "appointment" })
      .eq("id", lead.id);

    return NextResponse.json({
      results: [
        {
          toolCallId: toolCall.id,
          result: "Appointment booked. WhatsApp sent.",
        },
      ],
    });
  } catch (err: any) {
    console.error("book-appointment error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
