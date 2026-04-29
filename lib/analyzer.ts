// lib/analyzer.ts
// Step 1: Quick analysis — categorize by website status only
// Step 2: AI deep-analysis runs separately for businesses WITH websites

export type Priority = "hot" | "warm" | "cold";
export type WebsiteStatus = "none" | "social-only" | "whatsapp-only" | "has-website" | "pending-analysis";

export interface RawLead {
  title?: string;
  rating?: string | number;
  reviews?: string | number;
  phone?: string;
  industry?: string;
  address?: string;
  website?: string;
  google_maps_link?: string;
}

export interface AnalyzedLead {
  business_name: string;
  niche: string;
  contact_name: string;
  phone: string;
  rating: number;
  reviews_count: number;
  website: string | null;
  website_status: WebsiteStatus;
  address: string;
  google_maps_link: string;
  gaps: string[];
  priority: Priority;
  analysis_notes: string;
  status: string;
  needs_ai_analysis: boolean;
  design_score: number | null;
}

const SOCIAL_DOMAINS = ["facebook.com", "fb.com", "instagram.com", "tiktok.com", "twitter.com", "x.com", "linkedin.com", "youtube.com", "linktr.ee"];
const WHATSAPP_DOMAINS = ["wa.me", "wa.link", "whatsapp.com", "api.whatsapp.com"];

function detectInitialWebsiteStatus(website?: string): { status: WebsiteStatus; needsAI: boolean } {
  if (!website || website.trim() === "" || website.length < 5 || website.toLowerCase().includes("no website")) {
    return { status: "none", needsAI: false };
  }
  const url = website.toLowerCase().trim();
  if (WHATSAPP_DOMAINS.some(d => url.includes(d))) return { status: "whatsapp-only", needsAI: false };
  if (SOCIAL_DOMAINS.some(d => url.includes(d))) return { status: "social-only", needsAI: false };
  // Has a real domain — needs AI analysis
  return { status: "pending-analysis", needsAI: true };
}

function normalizePhone(phone?: string): string {
  if (!phone) return "";
  let p = phone.replace(/\D/g, "");
  if (!p) return "";
  if (p.startsWith("60")) return "+" + p;
  if (p.startsWith("0")) return "+60" + p.substring(1);
  return "+" + p;
}

function detectNiche(industry?: string, title?: string): string {
  const text = `${industry || ""} ${title || ""}`.toLowerCase();
  if (text.includes("dent") || text.includes("pergigian")) return "Dental";
  if (text.includes("workshop") || text.includes("auto") || text.includes("car ") || text.includes("garage")) return "Workshop";
  if (text.includes("restaurant") || text.includes("cafe") || text.includes("food") || text.includes("nasi") || text.includes("kopitiam") || text.includes("kedai makan")) return "F&B";
  if (text.includes("clinic") || text.includes("medical") || text.includes("klinik")) return "Medical";
  if (text.includes("salon") || text.includes("spa") || text.includes("beauty")) return "Beauty";
  if (text.includes("law") || text.includes("legal")) return "Legal";
  return industry?.trim() || "Other";
}

export function analyzeLead(raw: RawLead): AnalyzedLead {
  const { status, needsAI } = detectInitialWebsiteStatus(raw.website);
  const phone = normalizePhone(raw.phone);
  const niche = detectNiche(raw.industry, raw.title);
  const reviews = parseInt(String(raw.reviews || 0)) || 0;
  const rating = parseFloat(String(raw.rating || 0)) || 0;

  const gaps: string[] = [];
  let priority: Priority;
  let notes = "";

  switch (status) {
    case "none":
      gaps.push("no-website");
      priority = "hot";
      notes = "🔥 No website at all. Perfect target for web design + Google.";
      break;
    case "whatsapp-only":
      gaps.push("no-website", "whatsapp-only");
      priority = "hot";
      notes = "🔥 WhatsApp link only — no real website. Hot target.";
      break;
    case "social-only":
      gaps.push("no-website", "social-only");
      priority = "hot";
      notes = "🔥 Social media only (Facebook/Instagram). No proper website.";
      break;
    case "pending-analysis":
      // Will be classified by AI - default to cold until analyzed
      priority = "cold";
      notes = "⏳ Has website — pending AI design analysis...";
      break;
    default:
      priority = "cold";
      notes = "Has website. Skipping.";
  }

  return {
    business_name: (raw.title || "Unknown").trim(),
    niche,
    contact_name: "",
    phone,
    rating,
    reviews_count: reviews,
    website: raw.website || null,
    website_status: status,
    address: raw.address || "",
    google_maps_link: raw.google_maps_link || "",
    gaps,
    priority,
    analysis_notes: notes,
    status: priority === "cold" && status !== "pending-analysis" ? "skipped" : "pending",
    needs_ai_analysis: needsAI,
    design_score: null,
  };
}
