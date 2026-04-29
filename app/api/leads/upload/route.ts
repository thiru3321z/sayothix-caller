// app/api/leads/upload/route.ts
// Accepts CSV file, parses it, inserts leads into Supabase

import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { supabase } from "@/lib/supabase";

interface CsvRow {
  business_name: string;
  niche: string;
  contact_name: string;
  phone: string;
  gaps?: string;          // pipe-separated, e.g. "no-website|weak-gmb"
  reviews_count?: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse<CsvRow>(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json({ error: "CSV parse errors", details: parsed.errors }, { status: 400 });
    }

    // Transform rows for Supabase
    const leads = parsed.data
      .filter(row => row.business_name && row.phone)
      .map(row => ({
        business_name: row.business_name.trim(),
        niche: row.niche?.trim() || "Other",
        contact_name: row.contact_name?.trim() || "",
        phone: row.phone.trim().replace(/\s+/g, ""),  // strip spaces
        gaps: row.gaps ? row.gaps.split("|").map(g => g.trim()) : [],
        reviews_count: parseInt(row.reviews_count || "0"),
        status: "pending",
      }));

    if (leads.length === 0) {
      return NextResponse.json({ error: "No valid leads in CSV" }, { status: 400 });
    }

    const { error } = await supabase.from("leads").insert(leads);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: leads.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
