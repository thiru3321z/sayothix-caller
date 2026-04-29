// lib/supabase.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

// Lazy initialization - only creates the client when first used
// This prevents build-time errors when env vars aren't available yet
function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase env vars are missing. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.");
  }

  _supabase = createClient(url, key, {
    auth: { persistSession: false },
  });
  return _supabase;
}

// Proxy that defers all calls until actual use
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    return (client as any)[prop];
  },
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
