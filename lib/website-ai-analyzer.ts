// lib/website-ai-analyzer.ts
// Uses Claude API to score website design quality (1-10)
// Score < 4 = Warm (rebuild opportunity), Score >= 4 = Cold (skip)

interface AnalysisResult {
  score: number;
  notes: string;
  priority: "warm" | "cold";
  status: "pending" | "skipped";
  gaps: string[];
}

export async function analyzeWebsiteWithAI(url: string, businessName: string): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      score: 5,
      notes: "AI key not configured — defaulted to cold",
      priority: "cold",
      status: "skipped",
      gaps: [],
    };
  }

  // Fetch the website HTML first
  let html = "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Sayothix Lead Analyzer)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return {
        score: 2,
        notes: `Site failed to load (${res.status}). Hot target — broken site.`,
        priority: "warm",
        status: "pending",
        gaps: ["site-broken", "outdated-site"],
      };
    }
    html = await res.text();
    // Trim to first 15kb so we don't blow API tokens
    html = html.slice(0, 15000);
  } catch (e: any) {
    return {
      score: 2,
      notes: "Could not load website — possibly broken or down. Warm target.",
      priority: "warm",
      status: "pending",
      gaps: ["site-broken", "outdated-site"],
    };
  }

  // Send to Claude
  const prompt = `You are evaluating a Malaysian business website for a digital marketing agency that pitches website redesigns.

Business: ${businessName}
URL: ${url}

Below is the HTML (first 15kb). Score this website 1-10 on overall design quality, considering:
- Modern visual design (responsive, clean layout, good typography)
- First impression / professional look
- Conversion elements (clear CTAs, contact info, services)
- Service information completeness
- Trust signals (testimonials, real photos vs stock, credentials)
- Content quality
- Site structure and navigation
- Mobile-friendliness signals

SCORING:
- 1-3 = Very outdated, looks like 2010s template, broken layouts, no mobile support
- 4-6 = Average, functional but dated, generic templates
- 7-10 = Modern, professional, conversion-optimized

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
      console.error("Claude API error:", response.status, errText);
      return {
        score: 5,
        notes: "AI analysis failed — defaulted to cold",
        priority: "cold",
        status: "skipped",
        gaps: [],
      };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const score = Number(parsed.score) || 5;
    const summary = parsed.summary || "Analyzed";
    const issues = Array.isArray(parsed.key_issues) ? parsed.key_issues : [];

    if (score < 4) {
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
    console.error("AI analysis exception:", e);
    return {
      score: 5,
      notes: `AI parse failed: ${e.message}. Defaulted to cold.`,
      priority: "cold",
      status: "skipped",
      gaps: [],
    };
  }
}
