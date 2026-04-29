// app/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Phone, Upload, Users, History, BarChart3, Mic, TrendingUp, PhoneCall, XCircle, AlertCircle, Video, MessageCircle, Flame, Snowflake, Zap, ExternalLink } from "lucide-react";

type Lead = {
  id: string;
  business_name: string;
  niche: string;
  contact_name: string;
  phone: string;
  gaps: string[];
  reviews_count: number;
  rating: number;
  website: string | null;
  website_status: string;
  address: string;
  google_maps_link: string;
  priority: "hot" | "warm" | "cold";
  analysis_notes: string;
  status: string;
};

type Call = {
  id: string;
  lead_id: string;
  duration_seconds: number;
  outcome: string;
  transcript: { speaker: string; text: string }[];
  notes: string;
  meeting_time: string | null;
  meet_link: string | null;
  whatsapp_sent: boolean;
  created_at: string;
  business_name?: string;
  contact_name?: string;
  niche?: string;
};

// ===== DARK THEME =====
const T = {
  bg: "#0d0f14",
  card: "#161820",
  border: "#1f2235",
  text: "#e8eaf0",
  textMuted: "#9ca3af",
  textDim: "#6b7280",
  textVeryDim: "#4b5563",
  accent: "#a855f7",         // purple to match logo
  accentBg: "#1a1025",
  accentBorder: "#a855f755",
  green: "#22c87a",
  greenBg: "#0d1f14",
  hot: "#ef4444",
  hotBg: "#1c0d0d",
  hotBorder: "#ef444455",
  warm: "#f59e0b",
  warmBg: "#1c1505",
  warmBorder: "#f59e0b55",
  cold: "#3b82f6",
  coldBg: "#0d1525",
};

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  "pending":         { bg: T.warmBg,   text: T.warm,    label: "Pending" },
  "called":          { bg: T.coldBg,   text: T.cold,    label: "Called" },
  "appointment":     { bg: T.greenBg,  text: T.green,   label: "Appointment" },
  "call-back":       { bg: T.warmBg,   text: T.warm,    label: "Call back" },
  "not-interested":  { bg: T.hotBg,    text: T.hot,     label: "Not interested" },
  "no-answer":       { bg: "#1f2235",  text: T.textDim, label: "No answer" },
  "not-in-service":  { bg: T.hotBg,    text: T.hot,     label: "Not in service" },
  "skipped":         { bg: "#1f2235",  text: T.textDim, label: "Skipped" },
};

const priorityStyles: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
  "hot":  { bg: T.hotBg,    text: T.hot,    border: T.hotBorder,    icon: Flame,     label: "Hot" },
  "warm": { bg: T.warmBg,   text: T.warm,   border: T.warmBorder,   icon: Zap,       label: "Warm" },
  "cold": { bg: T.coldBg,   text: T.cold,   border: "#3b82f655",    icon: Snowflake, label: "Cold" },
};

const websiteStatusLabels: Record<string, { label: string; color: string }> = {
  "none":          { label: "No website",     color: T.hot },
  "whatsapp-only": { label: "WhatsApp only",  color: T.hot },
  "social-only":   { label: "Social only",    color: T.hot },
  "bad-website":   { label: "Weak website",   color: T.warm },
  "good-website":  { label: "Has website",    color: T.green },
};

const outcomeStyles: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  "appointment":     { bg: T.greenBg,  text: T.green,   icon: Video,       label: "Appointment booked" },
  "call-back":       { bg: T.warmBg,   text: T.warm,    icon: Phone,       label: "Call back" },
  "not-interested":  { bg: T.hotBg,    text: T.hot,     icon: XCircle,     label: "Not interested" },
  "no-answer":       { bg: "#1f2235",  text: T.textDim, icon: PhoneCall,   label: "No answer" },
  "not-in-service":  { bg: T.hotBg,    text: T.hot,     icon: XCircle,     label: "Not in service" },
  "called":          { bg: T.coldBg,   text: T.cold,    icon: AlertCircle, label: "Completed" },
};

const nicheColors: Record<string, { bg: string; text: string }> = {
  "Dental":   { bg: T.accentBg, text: T.accent  },
  "Workshop": { bg: "#1c1505",  text: T.warm    },
  "F&B":      { bg: "#1a0f1c",  text: "#d946ef" },
  "Medical":  { bg: T.coldBg,   text: T.cold    },
  "Beauty":   { bg: "#1a0f1c",  text: "#d946ef" },
  "Other":    { bg: "#1f2235",  text: T.textMuted },
};

export default function Page() {
  const [activeTab, setActiveTab] = useState("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [selectedCall, setSelectedCall] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "hot" | "warm" | "cold">("all");

  async function refreshAll() {
    const l = await fetch("/api/leads").then(r => r.json());
    setLeads(l.leads || []);
    const c = await fetch("/api/calls").then(r => r.json());
    setCalls(c.calls || []);
  }

  useEffect(() => { refreshAll(); }, []);

  const tabs = [
    { id: "dashboard", label: "Dashboard",    icon: BarChart3 },
    { id: "leads",     label: "Leads",        icon: Users },
    { id: "history",   label: "Call History", icon: History },
    { id: "agent",     label: "Agent Config", icon: Mic },
    { id: "analytics", label: "Analytics",    icon: TrendingUp },
  ];

  async function handleCall(leadId: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (data.success) await refreshAll();
      else alert("Call failed: " + (data.error || "unknown"));
    } catch (err: any) { alert("Error: " + err.message); }
    setLoading(false);
  }

  async function handleCallNext() {
    setLoading(true);
    const res = await fetch("/api/call/next", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      alert(`Calling ${data.lead.business_name} (${data.lead.priority.toUpperCase()})`);
      await refreshAll();
    } else alert(data.message || data.error || "No leads to call");
  }

  async function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    const res = await fetch("/api/leads/upload", { method: "POST", body: formData });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      alert(`✅ Imported ${data.count} leads\n🔥 ${data.stats.hot} Hot · ⚡ ${data.stats.warm} Warm · ❄ ${data.stats.cold} Cold`);
      await refreshAll();
    } else alert("Upload failed: " + data.error);
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text }}>
      {/* HEADER */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/sayothix-logo.webp" alt="Sayothix" width={36} height={36} style={{ borderRadius: 6 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: T.text }}>Sayothix Caller</div>
            <div style={{ fontSize: 11, color: T.textDim }}>AI agent · Isabell · Johor Bahru</div>
          </div>
        </div>
        <button onClick={handleCallNext} disabled={loading}
          style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${T.accent}, #6b21a8)`, color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, boxShadow: "0 0 0 1px " + T.accentBorder }}>
          <Flame size={14} /> Call Next (Hot first)
        </button>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 65px)" }}>
        {/* SIDEBAR */}
        <div style={{ width: 220, background: T.card, borderRight: `1px solid ${T.border}`, padding: "20px 12px" }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ width: "100%", padding: "10px 12px", marginBottom: 2, borderRadius: 8, border: "none",
                  background: active ? T.accentBg : "transparent",
                  color: active ? T.accent : T.textMuted,
                  fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                  borderLeft: active ? `2px solid ${T.accent}` : "2px solid transparent" }}>
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, padding: 28, overflow: "auto" }}>
          {activeTab === "dashboard" && <DashboardTab leads={leads} calls={calls} />}
          {activeTab === "leads"     && <LeadsTab leads={leads} filter={filter} setFilter={setFilter} onCall={handleCall} onUpload={handleCSVUpload} loading={loading} />}
          {activeTab === "history"   && <HistoryTab calls={calls} selectedCall={selectedCall} setSelectedCall={setSelectedCall} />}
          {activeTab === "agent"     && <AgentTab />}
          {activeTab === "analytics" && <AnalyticsTab calls={calls} leads={leads} />}
        </div>
      </div>
    </div>
  );
}

// ============ DASHBOARD ============
function DashboardTab({ leads, calls }: { leads: Lead[]; calls: Call[] }) {
  const today = new Date().toDateString();
  const todaysCalls = calls.filter(c => new Date(c.created_at).toDateString() === today);
  const appointments = calls.filter(c => c.outcome === "appointment").length;
  const hotPending = leads.filter(l => l.priority === "hot" && l.status === "pending").length;
  const warmPending = leads.filter(l => l.priority === "warm" && l.status === "pending").length;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px", color: T.text }}>Selamat petang</h1>
      <p style={{ fontSize: 13, color: T.textDim, margin: "0 0 24px" }}>Isabell's been busy. Here's today's progress.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "🔥 Hot pending",  value: hotPending,        color: T.hot   },
          { label: "⚡ Warm pending", value: warmPending,       color: T.warm  },
          { label: "Calls today",     value: todaysCalls.length, color: T.cold },
          { label: "Appointments",    value: appointments,       color: T.green },
        ].map((m, i) => (
          <div key={i} style={{ background: T.card, borderRadius: 14, padding: "18px 20px", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, color: T.textDim, marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontSize: 30, fontWeight: 600, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ LEADS ============
function LeadsTab({ leads, filter, setFilter, onCall, onUpload, loading }: any) {
  const filtered = filter === "all" ? leads : leads.filter((l: Lead) => l.priority === filter);
  const counts = {
    all: leads.length,
    hot: leads.filter((l: Lead) => l.priority === "hot").length,
    warm: leads.filter((l: Lead) => l.priority === "warm").length,
    cold: leads.filter((l: Lead) => l.priority === "cold").length,
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px", color: T.text }}>Leads</h1>
        <p style={{ fontSize: 13, color: T.textDim, margin: 0 }}>Auto-analyzed by website status. Hot called first, Warm second, Cold skipped.</p>
      </div>

      <label style={{ display: "block", background: T.card, border: `1.5px dashed ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20, textAlign: "center", cursor: "pointer", transition: "border-color 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
        onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
        <Upload size={20} color={T.textDim} style={{ marginBottom: 8 }} />
        <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 4 }}>{loading ? "Analyzing & uploading..." : "Click to upload scraper CSV"}</div>
        <div style={{ fontSize: 11, color: T.textDim }}>Auto-detects: Title, Phone, Industry, Website, Address, Reviews, Rating</div>
        <input type="file" accept=".csv" onChange={onUpload} style={{ display: "none" }} />
      </label>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { id: "all",  label: `All · ${counts.all}`,    color: T.text   },
          { id: "hot",  label: `🔥 Hot · ${counts.hot}`, color: T.hot    },
          { id: "warm", label: `⚡ Warm · ${counts.warm}`, color: T.warm },
          { id: "cold", label: `❄ Cold · ${counts.cold}`,  color: T.cold },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{
              padding: "7px 14px", borderRadius: 20,
              border: filter === f.id ? `1.5px solid ${f.color}` : `1px solid ${T.border}`,
              background: filter === f.id ? `${f.color}22` : T.card,
              color: filter === f.id ? f.color : T.textMuted,
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>{f.label}</button>
        ))}
      </div>

      <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "0.7fr 2fr 1fr 1.3fr 1.5fr 1fr 90px", padding: "12px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
          <div>Priority</div><div>Business</div><div>Niche</div><div>Phone</div><div>Website</div><div>Status</div><div></div>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: T.textDim, fontSize: 13 }}>
            No leads {filter !== "all" ? `with priority "${filter}"` : ""}. Upload a CSV to begin.
          </div>
        )}
        {filtered.map((lead: Lead) => {
          const p = priorityStyles[lead.priority] || priorityStyles.warm;
          const PIcon = p.icon;
          const s = statusStyles[lead.status] || statusStyles.pending;
          const n = nicheColors[lead.niche] || nicheColors.Other;
          const ws = websiteStatusLabels[lead.website_status] || { label: lead.website_status, color: T.textDim };
          const isCold = lead.priority === "cold";

          return (
            <div key={lead.id} style={{ display: "grid", gridTemplateColumns: "0.7fr 2fr 1fr 1.3fr 1.5fr 1fr 90px", padding: "14px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 13, alignItems: "center", opacity: isCold ? 0.5 : 1 }}>
              <div>
                <span style={{ background: p.bg, color: p.text, fontSize: 11, padding: "4px 9px", borderRadius: 6, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, border: `1px solid ${p.border}` }}>
                  <PIcon size={11} /> {p.label}
                </span>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: T.text }}>{lead.business_name}</div>
                {lead.analysis_notes && <div style={{ fontSize: 11, color: T.textDim, marginTop: 3, lineHeight: 1.4 }}>{lead.analysis_notes}</div>}
              </div>
              <div>
                <span style={{ background: n.bg, color: n.text, fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 500 }}>{lead.niche}</span>
              </div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: T.textMuted }}>{lead.phone}</div>
              <div>
                <div style={{ fontSize: 11, color: ws.color, fontWeight: 600 }}>{ws.label}</div>
                {lead.website && (
                  <a href={lead.website} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: T.cold, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                    <ExternalLink size={9} /> view
                  </a>
                )}
              </div>
              <div>
                <span style={{ background: s.bg, color: s.text, fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 500 }}>{s.label}</span>
              </div>
              <div>
                {!isCold ? (
                  <button onClick={() => onCall(lead.id)} disabled={loading}
                    style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${T.accentBorder}`, background: T.accentBg, color: T.accent, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                    <Phone size={11} /> Call
                  </button>
                ) : (
                  <span style={{ fontSize: 10, color: T.textVeryDim }}>Skipped</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ HISTORY ============
function HistoryTab({ calls, selectedCall, setSelectedCall }: any) {
  if (calls.length === 0) {
    return <div style={{ color: T.textDim }}>No calls yet. Upload leads and start calling.</div>;
  }
  const call = calls[selectedCall];
  const o = outcomeStyles[call.outcome] || outcomeStyles.called;
  const OIcon = o.icon;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px", color: T.text }}>Call History</h1>
      <p style={{ fontSize: 13, color: T.textDim, margin: "0 0 20px" }}>Review what Isabell said.</p>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden", maxHeight: "75vh", overflowY: "auto" }}>
          {calls.map((c: Call, i: number) => {
            const co = outcomeStyles[c.outcome] || outcomeStyles.called;
            const Icon = co.icon;
            const active = selectedCall === i;
            return (
              <button key={c.id} onClick={() => setSelectedCall(i)}
                style={{ width: "100%", padding: "14px 16px", border: "none", borderBottom: `1px solid ${T.border}`, background: active ? T.accentBg : "transparent", cursor: "pointer", textAlign: "left", borderLeft: active ? `3px solid ${T.accent}` : "3px solid transparent" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{c.business_name || "Unknown"}</div>
                  <Icon size={14} color={co.text} />
                </div>
                <div style={{ fontSize: 11, color: T.textDim }}>{c.contact_name} · {c.niche}</div>
                <div style={{ fontSize: 11, color: T.textVeryDim, marginTop: 4 }}>{new Date(c.created_at).toLocaleString()}</div>
              </button>
            );
          })}
        </div>

        <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, padding: 24 }}>
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: T.text }}>{call.business_name}</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>{new Date(call.created_at).toLocaleString()} · {Math.floor(call.duration_seconds / 60)}:{String(call.duration_seconds % 60).padStart(2, "0")}</div>
          </div>

          <div style={{ marginBottom: 20 }}>
            {call.transcript?.map((line: any, i: number) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%",
                  background: line.speaker === "agent" ? T.accent : "#1f2235",
                  color: line.speaker === "agent" ? "#fff" : T.text,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {line.speaker === "agent" ? "I" : "L"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: T.textDim, marginBottom: 3, fontWeight: 600 }}>{line.speaker === "agent" ? "Isabell" : call.contact_name || "Lead"}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: T.text }}>{line.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: T.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Outcome</div>
            <div style={{ background: o.bg, borderRadius: 10, padding: 16, border: `1px solid ${o.text}33` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <OIcon size={18} color={o.text} />
                <div style={{ fontSize: 15, fontWeight: 600, color: o.text }}>{o.label}</div>
              </div>
              {call.notes && <div style={{ fontSize: 12, color: o.text, opacity: 0.85 }}>{call.notes}</div>}
              {call.outcome === "appointment" && call.whatsapp_sent && (
                <div style={{ background: T.bg, borderRadius: 6, padding: 10, marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <MessageCircle size={13} color={T.green} />
                  <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>WhatsApp sent ✓</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ AGENT ============
function AgentTab() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px", color: T.text }}>Agent Configuration</h1>
      <p style={{ fontSize: 13, color: T.textDim, margin: "0 0 20px" }}>Isabell's settings (in Vapi dashboard).</p>
      <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: T.text }}>Language Rules</div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: T.hot, marginBottom: 6, fontWeight: 700, letterSpacing: 0.5 }}>NEVER SAY</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["SEO", "rankings", "backlinks", "domain authority", "digital marketing", "online presence"].map(w => (
              <span key={w} style={{ background: T.hotBg, color: T.hot, fontSize: 11, padding: "4px 10px", borderRadius: 4, border: `1px solid ${T.hotBorder}` }}>{w}</span>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: T.green, marginBottom: 6, fontWeight: 700, letterSpacing: 0.5 }}>ALWAYS SAY</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["get more customer enquiries", "help people find you on Google", "more customers calling"].map(w => (
              <span key={w} style={{ background: T.greenBg, color: T.green, fontSize: 11, padding: "4px 10px", borderRadius: 4, border: `1px solid ${T.green}55` }}>{w}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ ANALYTICS ============
function AnalyticsTab({ calls, leads }: { calls: Call[]; leads: Lead[] }) {
  const total = calls.length || 1;
  const connected = calls.filter(c => c.duration_seconds > 10).length;
  const booked = calls.filter(c => c.outcome === "appointment").length;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px", color: T.text }}>Analytics</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, margin: "16px 0" }}>
        {[
          { label: "Total leads",   value: leads.length },
          { label: "Calls made",    value: calls.length },
          { label: "Appointments",  value: booked       },
        ].map((m, i) => (
          <div key={i} style={{ background: T.card, borderRadius: 12, padding: 18, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, color: T.textDim }}>{m.label}</div>
            <div style={{ fontSize: 28, fontWeight: 600, color: T.text, marginTop: 6 }}>{m.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: T.card, borderRadius: 12, padding: 24, border: `1px solid ${T.border}` }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: T.text }}>Conversion Funnel</div>
        {[
          { label: "Dialed",    value: total,     pct: 100, color: T.text   },
          { label: "Connected", value: connected, pct: Math.round(connected / total * 100), color: T.cold },
          { label: "Booked",    value: booked,    pct: Math.round(booked / total * 100), color: T.green },
        ].map((row, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6, color: T.text }}>
              <span>{row.label}</span><span style={{ color: T.textDim }}>{row.value} · {row.pct}%</span>
            </div>
            <div style={{ height: 8, background: T.bg, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${row.pct}%`, background: row.color, borderRadius: 4 }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
