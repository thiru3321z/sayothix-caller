// lib/website-ai-analyzer.ts
// Threshold: score <= 5 = WARM (rebuild opportunity), > 5 = COLD (skip)

interface AnalysisResult {
  score: number;
  notes: string;
  priority: "warm" | "cold";
  status: "pending" | "skipped";
  gaps: string[];
}

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,ms;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

async function fetchWebsiteHtml(url: string): Promise<{ html: string; blocked: boolean; error?: string }> {
  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith("http")) cleanUrl = "https://" + cleanUrl;

  try {
    const res = await fetch(cleanUrl, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });

    if (!res.ok) {
      if (res.status === 403 || res.status === 429) {
        return { html: "", blocked: true, error: `Status ${res.status}` };
      }
      return { html: "", blocked: false, error: `Status ${res.status}` };
    }

    const html = await res.text();
    const lower = html.toLowerCase();
    const botWallSigns = [
      "checking your browser", "cloudflare", "ray id",
      "verify you are human", "cf-browser-verification",
      "captcha", "challenge-platform", "ddos protection", "just a moment",
    ];
    const isBotWall = botWallSigns.filter(s => lower.includes(s)).length >= 2;

    return { html: html.slice(0, 15000), blocked: isBotWall };
  } catch (e: any) {
    return { html: "", blocked: false, error: e.message };
  }
}

export async function analyzeWebsiteWithAI(url: string, businessName: string): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { score: 5, notes: "AI key not configured", priority: "cold", status: "skipped", gaps: [] };
  }

  const { html, blocked, error } = await fetchWebsiteHtml(url);

  if (blocked) {
    return {
      score: 5,
      notes: `⚡ Site blocks automated checks (Cloudflare/bot-wall). Manual review recommended.`,
      priority: "warm",
      status: "pending",
      gaps: ["needs-manual-review"],
    };
  }
  if (!html) {
    return {
      score: 3,
      notes: `⚡ Site failed to load (${error || "unknown"}). Possibly broken — pitch redesign.`,
      priority: "warm",
      status: "pending",
      gaps: ["site-broken", "outdated-site"],
    };
  }

  const prompt = `You are evaluating a Malaysian business website for a digital marketing agency that pitches website redesigns.

Business: ${businessName}
URL: ${url}

Below is the HTML (first 15kb). Score this website 1-10 on overall design quality, considering:
- Modern visual design (responsive, clean layout, typography)
- First impression / professional look
- Conversion elements (clear CTAs, contact info, services)
- Service information completeness
- Trust signals (testimonials, real photos vs stock, credentials)
- Content quality
- Site structure and navigation
- Mobile-friendliness signals

SCORING:
- 1-3 = Very outdated, broken layouts, no mobile, looks like 2010s template
- 4-5 = Below average, dated design, generic templates, weak conversion
- 6-7 = Decent, functional, somewhat modern
- 8-10 = Modern, professional, conversion-optimized

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "score": <1-10>,
  "summary": "<one short sentence describing the design quality>",
  "key_issues": ["<issue 1>", "<issue 2>", "<issue 3>"]
}

HTML:
${html}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Analyzer] Claude HTTP ${response.status} for ${url}:`, errText.slice(0, 300));
      return {
        score: 5,
        notes: `⚠️ Claude API ${response.status}. Marked for review.`,
        priority: "warm",
        status: "pending",
        gaps: ["needs-manual-review"],
      };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    if (!text) {
      console.error(`[Analyzer] Empty Claude response for ${url}`);
      return {
        score: 5,
        notes: `⚠️ Empty AI response. Marked for review.`,
        priority: "warm",
        status: "pending",
        gaps: ["needs-manual-review"],
      };
    }

    // Extract JSON robustly — strip markdown, find object boundaries
    let cleaned = text.replace(/```json|```/g, "").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error(`[Analyzer] JSON parse failed for ${url}. Raw:`, text.slice(0, 300));
      return {
        score: 5,
        notes: `⚠️ AI returned invalid JSON. Marked for review.`,
        priority: "warm",
        status: "pending",
        gaps: ["needs-manual-review"],
      };
    }

    const score = Number(parsed.score) || 5;
    const summary = parsed.summary || "Analyzed";
    const issues = Array.isArray(parsed.key_issues) ? parsed.key_issues : [];

    if (score <= 5) {
      return {
        score,
        notes: `⚡ Score ${score}/10. ${summary} Pitch redesign.`,
        priority: "warm",
        status: "pending",
        gaps: ["weak-design", "outdated-site", ...issues.slice(0, 2).map((i: string) => i.toLowerCase().replace(/\s+/g, "-").slice(0, 30))],
      };
    } else {
      return {
        score,
        notes: `❄ Score ${score}/10. ${summary} Skip.`,
        priority: "cold",
        status: "skipped",
        gaps: [],
      };
    }
  } catch (e: any) {
    console.error(`[Analyzer] Exception for ${url}:`, e.message);
    return {
      score: 5,
      notes: `⚠️ Exception: ${e.message.slice(0, 80)}`,
      priority: "warm",
      status: "pending",
      gaps: ["needs-manual-review"],
    };
  }
}
