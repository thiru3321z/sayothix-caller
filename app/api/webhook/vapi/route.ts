// app/api/webhook/vapi/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendAppointmentWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// Detect outcome from Vapi's end-of-call data
function detectOutcome(payload: any): string {
  const endReason = payload?.message?.endedReason || "";
  const transcript = payload?.message?.transcript || "";
  const lower = transcript.toLowerCase();

  if (endReason === "customer-did-not-answer") return "no-answer";
  if (endReason === "twilio-failed-to-connect") return "not-in-service";

  // Check transcript for booking keywords
  if (lower.includes("google meet") && (lower.includes("send") || lower.includes("link"))) {
    return "appointment";
  }
  if (lower.includes("not interested") || lower.includes("don't call")) {
    return "not-interested";
  }
  if (lower.includes("call back") || lower.includes("call me later") || lower.includes("busy")) {
    return "call-back";
  }
  return "called";
}

// Try to extract appointment time from transcript using simple regex
function extractMeetingTime(transcript: string): string | null {
  const dayPattern = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i;
  const timePattern = /(\d{1,2})(?::(\d{2}))?\s?(am|pm)/i;

  const dayMatch = transcript.match(dayPattern);
  const timeMatch = transcript.match(timePattern);

  if (dayMatch && timeMatch) {
    return `${dayMatch[0]} at ${timeMatch[0]}`;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const event = payload?.message?.type;

    // Only act on end-of-call reports
    if (event !== "end-of-call-report") {
      return NextResponse.json({ ok: true });
    }

    const callId = payload.message.call?.id;
    const customerNumber = payload.message.customer?.number;
    const transcript = payload.message.transcript || "";
    const messages = payload.message.messages || [];
    const recordingUrl = payload.message.recordingUrl || null;
    const duration = Math.round(payload.message.durationSeconds || 0);

    const outcome = detectOutcome(payload);

    // Find lead by phone
    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("phone", customerNumber)
      .single();

    if (!lead) {
      console.warn("No lead found for", customerNumber);
      return NextResponse.json({ ok: true });
    }

    // ✅ Filter out system prompts and tool calls — only keep actual conversation
    const formattedTranscript = messages
      .filter((m: any) =>
        m.role !== "system" &&
        m.role !== "tool_calls" &&
        m.role !== "tool_call_result" &&
        m.role !== "function" &&
        (m.message || m.content) // skip empty messages
      )
      .map((m: any) => ({
        speaker: m.role === "assistant" ? "agent" : "lead",
        text: m.message || m.content || "",
      }));

    let meetingTime: string | null = null;
    let meetLink: string | null = null;

    // Save call to DB
    await supabase.from("calls").insert({
      lead_id: lead.id,
      vapi_call_id: callId,
      duration_seconds: duration,
      outcome,
      transcript: formattedTranscript,
      recording_url: recordingUrl,
      notes: payload.message.summary || "",
      meeting_time: meetingTime,
      meet_link: meetLink,
    });

    // Update lead status
    await supabase.from("leads").update({ status: outcome }).eq("id", lead.id);

    return NextResponse.json({ ok: true, outcome });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
