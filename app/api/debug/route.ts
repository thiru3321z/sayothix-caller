import { NextResponse, NextRequest } from "next/server";
import { analyzeWebsiteWithAI } from "@/lib/website-ai-analyzer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") || "https://denticadental.my";
  const name = req.nextUrl.searchParams.get("name") || "Test";

  let result = null;
  let errorCaught = null;
  let rawFetchTest = null;

  // First, try to fetch the URL directly to see what happens
  try {
    const fetchRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(12000),
    });
    rawFetchTest = {
      status: fetchRes.status,
      ok: fetchRes.ok,
      contentType: fetchRes.headers.get("content-type"),
      htmlPreview: (await fetchRes.text()).slice(0, 300),
    };
  } catch (e: any) {
    rawFetchTest = { error: e.message, name: e.name };
  }

  // Then run the actual analyzer
  try {
    result = await analyzeWebsiteWithAI(url, name);
  } catch (e: any) {
    errorCaught = { message: e.message, stack: e.stack?.slice(0, 500) };
  }

  return NextResponse.json({
    test_url: url,
    raw_fetch_test: rawFetchTest,
    analyzer_result: result,
    error_caught: errorCaught,
  });
}
