import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { analyzeWebsiteWithAI } from "@/lib/website-ai-analyzer";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST() {
  try {
    const { data: leads, error } = await supabase
      .from("leads")
      .select("id, business_name, website")
      .eq("website_status", "pending-analysis")
      .limit(20);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!leads || leads.length === 0) {
      return NextResponse.json({ success: true, message: "No pending leads", processed: 0 });
    }

    let processed = 0;
    let warmCount = 0;
    let coldCount = 0;

    const concurrency = 5;
    for (let i = 0; i < leads.length; i += concurrency) {
      const batch = leads.slice(i, i + concurrency);
      await Promise.all(
        batch.map(async (lead) => {
          if (!lead.website) return;
          try {
            const result = await analyzeWebsiteWithAI(lead.website, lead.business_name);
            await supabase
              .from("leads")
              .update({
                website_status: "has-website",
                priority: result.priority,
                status: result.status,
                analysis_notes: result.notes,
                design_score: result.score,
                gaps: result.gaps,
              })
              .eq("id", lead.id);
            processed++;
            if (result.priority === "warm") warmCount++;
            else coldCount++;
          } catch (e: any) {
            console.error("Failed:", lead.business_name, e.message);
          }
        })
      );
    }

    const { count: remaining } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("website_status", "pending-analysis");

    return NextResponse.json({
      success: true, processed,
      warm_count: warmCount, cold_count: coldCount,
      remaining: remaining || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
