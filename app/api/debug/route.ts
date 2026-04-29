import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_key_present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    anthropic_key_present: !!process.env.ANTHROPIC_API_KEY,
    anthropic_key_preview: process.env.ANTHROPIC_API_KEY?.slice(0, 12) || "MISSING",
  });
}
