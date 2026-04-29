// app/api/leads/upload/route.ts
// Quick analysis on upload, returns instantly
// Websites are queued for AI analysis

import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { supabase } from "@/lib/supabase";
import { analyzeLead, RawLead } from "@/lib/analyzer";

export const dynamic = "force-dynamic";

function normalizeRow(row: any): RawLead {
  const get = (...keys: string[]): string => {
    for (const k of keys) {
      const found = Object.keys(row).find(rk => rk.toLowerCase().trim() === k.toLowerCase());
      if (found && row[found]) return String(row[found]).trim();
    }
    return "";
  };
  return {
    title: get("title", "business_name", "name", "business", "company"),
    rating: get("rating", "stars"),
    reviews: get("reviews", "reviews_count", "review_count"),
    phone: get("phone", "phone_number", "contact"),
    industry: get("industry", "category", "type", "niche"),
    address: get("address", "location"),
    website: get("website", "url", "site"),
    google_maps_link: get("google_maps_link", "google_maps", "maps_link", "gmaps"),
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const text = await file.text();
    const parsed = Papa.parse<any>(text, { header: true, skipEmptyLines: true });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json({ error: "CSV parse failed" }, { status: 400 });
    }

    const analyzed = parsed.data
      .map(normalizeRow)
      .filter(r => r.title && r.phone)
      .map(analyzeLead);

    if (analyzed.length === 0) {
      return NextResponse.json({ error: "No valid leads (need title + phone columns)" }, { status: 400 });
    }

    const dbRows = analyzed.map(l => ({
      business_name: l.business_name,
      niche: l.niche,
      contact_name: l.contact_name,
      phone: l.phone,
      gaps: l.gaps,
      reviews_count: l.reviews_count,
      rating: l.rating,
      website: l.website,
      website_status: l.website_status,
      address: l.address,
      google_maps_link: l.google_maps_link,
      priority: l.priority,
      analysis_notes: l.analysis_notes,
      status: l.status,
      design_score: l.design_score,
    }));

    const { error } = await supabase.from("leads").insert(dbRows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const stats = {
      total: dbRows.length,
      hot: dbRows.filter(l => l.priority === "hot").length,
      warm: dbRows.filter(l => l.priority === "warm").length,
      cold: dbRows.filter(l => l.priority === "cold").length,
      pending_analysis: analyzed.filter(l => l.needs_ai_analysis).length,
    };

    return NextResponse.json({ success: true, count: dbRows.length, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
