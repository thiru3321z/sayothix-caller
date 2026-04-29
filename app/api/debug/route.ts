import { NextResponse } from "next/server";
import { analyzeWebsiteWithAI } from "@/lib/website-ai-analyzer";

export const dynamic = "force-dynamic";

export async function GET() {
  // Test the analyzer on a real website
  const testUrl = "https://drcheongdental.com";
  const testName = "Test Clinic";
  
  let result = null;
  let errorCaught = null;
  
  try {
    result = await analyzeWebsiteWithAI(testUrl, testName);
  } catch (e: any) {
    errorCaught = {
      message: e.message,
      stack: e.stack?.slice(0, 500),
      name: e.name,
    };
  }
  
  return NextResponse.json({
    anthropic_key_present: !!process.env.ANTHROPIC_API_KEY,
    anthropic_key_preview: process.env.ANTHROPIC_API_KEY?.slice(0, 15) || "MISSING",
    test_url: testUrl,
    test_result: result,
    error_caught: errorCaught,
  });
}
