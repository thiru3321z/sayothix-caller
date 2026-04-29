import { NextResponse, NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") || "https://denticadental.my";
  
  // Step 1: Fetch the website
  let html = "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
      signal: AbortSignal.timeout(10000),
    });
    html = await res.text();
  } catch (e: any) {
    return NextResponse.json({ step: "fetch", error: e.message });
  }

  // Step 2: Sanitize
  const sanitized = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);

  // Step 3: Try Claude API
  try {
    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: `Score this HTML 1-10. Reply only with {"score": N}. HTML: ${sanitized}` }],
      }),
    });

    const responseText = await apiRes.text();
    
    return NextResponse.json({
      url,
      sanitized_length: sanitized.length,
      sanitized_preview: sanitized.slice(0, 500),
      claude_status: apiRes.status,
      claude_response: responseText.slice(0, 2000),
    });
  } catch (e: any) {
    return NextResponse.json({ step: "claude", error: e.message });
  }
}
