// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

// Types matching the SQL schema
export interface Lead {
  id: string;
  business_name: string;
  niche: string;
  contact_name: string;
  phone: string;
  gaps: string[];
  reviews_count: number;
  status: "pending" | "called" | "appointment" | "call-back" | "not-interested" | "no-answer" | "not-in-service";
  created_at: string;
}

export interface Call {
  id: string;
  lead_id: string;
  vapi_call_id: string;
  duration_seconds: number;
  outcome: string;
  transcript: { speaker: string; text: string }[];
  recording_url: string | null;
  notes: string;
  meeting_time: string | null;
  meet_link: string | null;
  created_at: string;
}
