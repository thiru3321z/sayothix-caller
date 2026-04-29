// lib/whatsapp.ts
// Sends WhatsApp messages to YOU when an appointment is booked
// Uses Twilio's WhatsApp API

import twilio from "twilio";

interface AppointmentDetails {
  businessName: string;
  contactName: string;
  contactPhone: string;
  niche: string;
  meetingTime: string;
  meetLink: string;
}

export async function sendAppointmentWhatsApp(details: AppointmentDetails) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;
  const toNumber = process.env.OWNER_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    throw new Error("Missing Twilio WhatsApp env variables");
  }

  const client = twilio(accountSid, authToken);

  const message = `🎯 *New Appointment Booked!*

*Business:* ${details.businessName}
*Contact:* ${details.contactName}
*Niche:* ${details.niche}
*Phone:* ${details.contactPhone}

📅 *When:* ${details.meetingTime}
🔗 *Google Meet:* ${details.meetLink}

— Aira (Sayothix AI Caller)`;

  try {
    const result = await client.messages.create({
      from: fromNumber,
      to: `whatsapp:${toNumber}`,
      body: message,
    });
    return { success: true, sid: result.sid };
  } catch (error: any) {
    console.error("WhatsApp send failed:", error.message);
    return { success: false, error: error.message };
  }
}
