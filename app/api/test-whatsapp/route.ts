// app/api/test-whatsapp/route.ts
// Manual trigger to verify WhatsApp sending works end-to-end
// Hit this in your browser: https://sayothix-caller.vercel.app/api/test-whatsapp

import { NextResponse } from "next/server";
import { sendAppointmentWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await sendAppointmentWhatsApp({
      businessName: "Test Dental Clinic JB",
      contactName: "Dr Test",
      contactPhone: "+60187763232",
      niche: "Dental",
      meetingTime: "Tomorrow at 2 PM",
      meetLink: "https://meet.google.com/test-link-abc",
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
