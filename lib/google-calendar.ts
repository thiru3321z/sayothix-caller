// lib/google-calendar.ts
// Creates Google Calendar events with Meet links

import { google } from "googleapis";

interface CreateEventParams {
  summary: string;
  description: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  attendeeEmail?: string;
}

export async function createMeetEvent(params: CreateEventParams) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: params.summary,
      description: params.description,
      start: { dateTime: params.startTime, timeZone: "Asia/Kuala_Lumpur" },
      end: { dateTime: params.endTime, timeZone: "Asia/Kuala_Lumpur" },
      attendees: params.attendeeEmail ? [{ email: params.attendeeEmail }] : [],
      conferenceData: {
        createRequest: {
          requestId: `sayothix-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  return {
    eventId: event.data.id,
    meetLink: event.data.hangoutLink,
    htmlLink: event.data.htmlLink,
  };
}
