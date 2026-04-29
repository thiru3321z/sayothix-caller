// app/page.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Phone, Upload, Users, History, BarChart3, Mic, TrendingUp, PhoneCall, XCircle, AlertCircle, Video, MessageCircle, Flame, Snowflake, Zap, ExternalLink, Star, Play, Square, MapPin, Trash2, Search, Sparkles, Loader2 } from "lucide-react";

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
  design_score: number | null;
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

const T = {
  bg: "#0d0f14", card: "#161820", border: "#1f2235",
  text: "#e8eaf0", textMuted: "#9ca3af", textDim: "#6b7280", textVeryDim: "#4b5563",
  accent: "#a855f7", accentBg: "#1a1025", accentBorder: "#a855f755",
  green: "#22c87a", greenBg: "#0d1f14",
  hot: "#ef4444", hotBg: "#1c0d0d", hotBorder: "#ef444455",
  warm: "#f59e0b", warmBg: "#1c1505", warmBorder: "#f59e0b55",
  cold: "#3b82f6", coldBg: "#0d1525",
};

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  "pending":         { bg: T.warmBg,  text: T.warm,    label: "Pending" },
  "called":          { bg: T.coldBg,  text: T.cold,    label: "Called" },
  "appointment":     { bg: T.greenBg, text: T.green,   label: "Appointment" },
  "call-back":       { bg: T.warmBg,  text: T.warm,    label: "Call back" },
  "not-interested":  { bg: T.hotBg,   text: T.hot,     label: "Not interested" },
  "no-answer":       { bg: "#1f2235", text: T.textDim, label: "No answer" },
  "not-in-service":  { bg: T.hotBg,   text: T.hot,     label: "Not in service" },
  "skipped":         { bg: "#1f2235", text: T.textDim, label: "Skipped" },
};

const priorityStyles: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
  "hot":  { bg: T.hotBg,  text: T.hot,  border: T.hotBorder,  icon: Flame,     label: "Hot" },
  "warm": { bg: T.warmBg, text: T.warm, border: T.warmBorder, icon: Zap,       label: "Warm" },
  "cold": { bg: T.coldBg, text: T.cold, border: "#3b82f655",  icon: Snowflake, label: "Cold" },
};

const websiteStatusLabels: Record<string, { label: string; color: string; webDesign: string }> = {
  "none":              { label: "No website",     color: T.hot,    webDesign: "None" },
  "whatsapp-only":     { label: "WhatsApp only",  color: T.hot,    webDesign: "None" },
  "social-only":       { label: "Social only",    color: T.hot,    webDesign: "None" },
  "pending-analysis":  { label: "Analyzing...",   color: T.accent, webDesign: "..." },
  "has-website":       { label: "Has website",    color: T.green,  webDesign: "Scored" },
};

const outcomeStyles: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  "appointment":     { bg: T.greenBg, text: T.green,   icon: Video,       label: "Appointment booked" },
  "call-back":       { bg: T.warmBg,  text: T.warm,    icon: Phone,       label: "Call back" },
  "not-interested":  { bg: T.hotBg,   text: T.hot,     icon: XCircle,     label: "Not interested" },
  "no-answer":       { bg: "#1f2235", text: T.textDim, icon: PhoneCall,   label: "No answer" },
  "not-in-service":  { bg: T.hotBg,   text: T.hot,     icon: XCircle,     label: "Not in service" },
  "called":          { bg: T.coldBg,  text: T.cold,    icon: AlertCircle, label: "Completed" },
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
  const [activeTab, setActiveTab] = useState("dashboard");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [selectedCall, setSelectedCall] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "hot" | "warm" | "cold">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoCalling, setAutoCalling] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ done: 0, total: 0 });

  async function refreshAll() {
    try {
      const ts = Date.now();
      const lRes = await fetch(`/api/leads?t=${ts}`, { cache: "no-store" });
      const l = await lRes.json();
      setLeads(l.leads || []);
      const cRes = await fetch(`/api/calls?t=${ts}`, { cache: "no-store" });
      const c = await cRes.json();
      setCalls(c.calls || []);
    } catch (err) { console.error("Refresh error:", err); }
  }

  useEffect(() => { refreshAll(); }, []);

  // Background AI analyzer — keeps polling until all websites are analyzed
 async function runAIAnalysis() {
    setAnalyzingAI(true);
 
    // Get accurate starting count from the database
    const startRes = await fetch(`/api/leads?t=${Date.now()}`, { cache: "no-store" });
    const startData = await startRes.json();
    const total = (startData.leads || []).filter((l: any) => l.website_status === "pending-analysis").length;
 
    if (total === 0) {
      setAnalyzingAI(false);
      alert("No websites to analyze!");
      return;
    }
 
    setAnalysisProgress({ done: 0, total });
 
    let done = 0;
    let safetyLimit = 50; // max 50 batches = 1000 sites
 
    while (safetyLimit-- > 0) {
      const res = await fetch("/api/leads/analyze", { method: "POST", cache: "no-store" });
      const data = await res.json();
 
      if (!data.success) {
        console.error("Analyzer error:", data.error);
        break;
      }
 
      if (data.processed === 0) break;
 
      done += data.processed;
      const remaining = data.remaining || 0;
 
      // Update progress immediately
      setAnalysisProgress({ done: total - remaining, total });
 
      // Refresh leads in UI
      await refreshAll();
 
      if (remaining === 0) break;
 
      // Small pause between batches to be kind to the API
      await new Promise(r => setTimeout(r, 500));
    }
 
    setAnalyzingAI(false);
    await refreshAll();
    alert(`✅ Analysis complete! Check the Leads tab.`);
  }

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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }), cache: "no-store",
      });
      const data = await res.json();
      if (data.success) await refreshAll();
      else alert("Call failed: " + (data.error || "unknown"));
    } catch (err: any) { alert("Error: " + err.message); }
    setLoading(false);
  }

  async function handleStartCalling() {
    if (!confirm("Start auto-calling? Isabell will call all Hot leads first, then Warm. Skips Cold.")) return;
    setAutoCalling(true);
    setLoading(true);
    const res = await fetch("/api/call/next", { method: "POST", cache: "no-store" });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      alert(`📞 Calling ${data.lead.business_name} (${data.lead.priority.toUpperCase()})`);
      await refreshAll();
    } else {
      alert(data.message || data.error || "No leads to call");
      setAutoCalling(false);
    }
  }

  function handleStopCalling() { setAutoCalling(false); }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text }}>
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/sayothix-logo.webp" alt="Sayothix" width={36} height={36} style={{ borderRadius: 6 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: T.text }}>Sayothix Caller</div>
            <div style={{ fontSize: 11, color: T.textDim }}>AI agent · Isabell · Johor Bahru</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {analyzingAI && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: 20 }}>
              <Loader2 size={12} color={T.accent} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 11, color: T.accent, fontWeight: 600 }}>
                AI analyzing {analysisProgress.done}/{analysisProgress.total}
              </span>
            </div>
          )}
          {!autoCalling ? (
            <button onClick={handleStartCalling} disabled={loading}
              style={{ padding: "10px 20px", borderRadius: 8, border: "none",
                background: `linear-gradient(135deg, ${T.green}, #16a04d)`,
                color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontWeight: 700,
                boxShadow: `0 0 0 1px ${T.green}55, 0 4px 16px ${T.green}33` }}>
              <Play size={14} fill="#fff" /> Start Calling
            </button>
          ) : (
            <button onClick={handleStopCalling}
              style={{ padding: "10px 20px", borderRadius: 8, border: "none",
                background: T.hot, color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
              <Square size={12} fill="#fff" /> Stop Calling
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 65px)" }}>
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

        <div style={{ flex: 1, padding: 28, overflow: "auto" }}>
          {activeTab === "dashboard" && <DashboardTab leads={leads} calls={calls} autoCalling={autoCalling} />}
          {activeTab === "leads"     && <LeadsTab leads={leads} filter={filter} setFilter={setFilter} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onCall={handleCall} loading={loading} refreshAll={refreshAll} setLoading={setLoading} runAIAnalysis={runAIAnalysis} analyzingAI={analyzingAI} />}
          {activeTab === "history"   && <HistoryTab calls={calls} selectedCall={selectedCall} setSelectedCall={setSelectedCall} />}
          {activeTab === "agent"     && <AgentTab />}
          {activeTab === "analytics" && <AnalyticsTab calls={calls} leads={leads} />}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function DashboardTab({ leads, calls, autoCalling }: { leads: Lead[]; calls: Call[]; autoCalling: boolean }) {
  const today = new Date().toDateString();
  const todaysCalls = calls.filter(c => new Date(c.created_at).toDateString() === today);
  const appointments = calls.filter(c => c.outcome === "appointment").length;
  const callBacks = calls.filter(c => c.outcome === "call-back").length;
  const notInterested = calls.filter(c => c.outcome === "not-interested").length;
  const noAnswer = calls.filter(c => c.outcome === "no-answer").length;
  const hotPending = leads.filter(l => l.priority === "hot" && l.status === "pending").length;
  const warmPending = leads.filter(l => l.priority === "warm" && l.status === "pending").length;
  const totalLeads = leads.length;
  const callsMade = calls.length;
  const connected = calls.filter(c => c.duration_seconds > 10).length;
  const avgDuration = calls.length > 0 ? Math.round(calls.reduce((s, c) => s + c.duration_seconds, 0) / calls.length) : 0;
  const conversionRate = callsMade > 0 ? Math.round((appointments / callsMade) * 100) : 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 4px", color: T.text }}>Selamat petang</h1>
          <p style={{ fontSize: 13, color: T.textDim, margin: 0 }}>Isabell's progress at a glance.</p>
        </div>
        {autoCalling && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: T.greenBg, border: `1px solid ${T.green}55`, borderRadius: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, boxShadow: `0 0 8px ${T.green}` }}></div>
            <span style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>Auto-calling active</span>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
        <KPI label="Total leads" value={totalLeads} sub={`${leads.filter(l => l.status === "pending").length} pending`} color={T.text} />
        <KPI label="Calls made" value={callsMade} sub={`${todaysCalls.length} today`} color={T.cold} />
        <KPI label="Appointments booked" value={appointments} sub={`${conversionRate}% conversion`} color={T.green} icon={Video} />
        <KPI label="Call backs scheduled" value={callBacks} sub="needs follow-up" color={T.warm} icon={Phone} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <KPI label="🔥 Hot pending" value={hotPending} sub="call first" color={T.hot} />
        <KPI label="⚡ Warm pending" value={warmPending} sub="call after hot" color={T.warm} />
        <KPI label="Connected" value={connected} sub="picked up call" color={T.cold} />
        <KPI label="Avg call duration" value={`${Math.floor(avgDuration / 60)}:${String(avgDuration % 60).padStart(2, "0")}`} sub="per call" color={T.text} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, borderRadius: 14, padding: 22, border: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: T.text }}>Conversion Funnel</div>
            <div style={{ fontSize: 11, color: T.textDim }}>All time</div>
          </div>
          {[
            { label: "Total dialed",       value: callsMade,     pct: 100, color: T.text   },
            { label: "Connected (picked up)", value: connected,  pct: callsMade > 0 ? Math.round(connected / callsMade * 100) : 0, color: T.cold },
            { label: "Appointment booked",  value: appointments, pct: callsMade > 0 ? Math.round(appointments / callsMade * 100) : 0, color: T.green },
          ].map((row, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: T.text }}>{row.label}</span>
                <span style={{ color: T.textDim }}>{row.value} <span style={{ color: row.color }}>· {row.pct}%</span></span>
              </div>
              <div style={{ height: 8, background: T.bg, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${row.pct}%`, background: row.color, borderRadius: 4 }}></div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: T.card, borderRadius: 14, padding: 22, border: `1px solid ${T.border}` }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 18, color: T.text }}>Call Outcomes</div>
          {[
            { label: "Appointment booked",  value: appointments,   color: T.green },
            { label: "Call back",           value: callBacks,      color: T.warm },
            { label: "Not interested",      value: notInterested,  color: T.hot },
            { label: "No answer",           value: noAnswer,       color: T.textDim },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: row.color }}></div>
                <span style={{ fontSize: 12, color: T.text }}>{row.label}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: T.card, borderRadius: 14, padding: 22, border: `1px solid ${T.border}` }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: T.text }}>Recent Calls</div>
        {calls.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: T.textDim, fontSize: 13 }}>No calls yet. Hit "Start Calling" to begin.</div>
        ) : calls.slice(0, 5).map(c => {
          const co = outcomeStyles[c.outcome] || outcomeStyles.called;
          const Icon = co.icon;
          return (
            <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Icon size={14} color={co.text} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{c.business_name || "Unknown"}</div>
                  <div style={{ fontSize: 11, color: T.textDim }}>{new Date(c.created_at).toLocaleString()}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: co.text, fontWeight: 600 }}>{co.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KPI({ label, value, sub, color, icon: Icon }: { label: string; value: any; sub?: string; color: string; icon?: any }) {
  return (
    <div style={{ background: T.card, borderRadius: 14, padding: "18px 20px", border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>{label}</div>
        {Icon && <Icon size={14} color={color} />}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textDim }}>{sub}</div>}
    </div>
  );
}

function LeadsTab({ leads, filter, setFilter, searchQuery, setSearchQuery, onCall, loading, refreshAll, setLoading, runAIAnalysis, analyzingAI }: any) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      alert("Please upload a .csv file");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    const res = await fetch("/api/leads/upload", { method: "POST", body: formData, cache: "no-store" });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      const pendingMsg = data.stats.pending_analysis > 0 ? `\n\n🤖 ${data.stats.pending_analysis} websites queued for AI analysis. Click "Analyze Websites" to begin.` : "";
      alert(`✅ Imported ${data.count} leads\n🔥 ${data.stats.hot} Hot · ⚡ ${data.stats.warm} Warm · ❄ ${data.stats.cold} Cold${pendingMsg}`);
      await refreshAll();
    } else alert("Upload failed: " + data.error);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  async function handleClearAll() {
    if (!confirm("⚠️ Clear ALL leads and call history? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure? Type-confirm not required, but this is your last chance.")) return;
    setLoading(true);
    const res = await fetch("/api/leads/clear", { method: "POST", cache: "no-store" });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      await refreshAll();
    } else alert("Clear failed: " + data.error);
  }

  // Filter + search
  let filtered = filter === "all" ? leads : leads.filter((l: Lead) => l.priority === filter);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((l: Lead) =>
      (l.business_name || "").toLowerCase().includes(q) ||
      (l.phone || "").toLowerCase().includes(q) ||
      (l.address || "").toLowerCase().includes(q) ||
      (l.niche || "").toLowerCase().includes(q) ||
      (l.website || "").toLowerCase().includes(q)
    );
  }

  const counts = {
    all: leads.length,
    hot: leads.filter((l: Lead) => l.priority === "hot").length,
    warm: leads.filter((l: Lead) => l.priority === "warm").length,
    cold: leads.filter((l: Lead) => l.priority === "cold").length,
  };
  const pendingAnalysisCount = leads.filter((l: Lead) => l.website_status === "pending-analysis").length;

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px", color: T.text }}>Leads</h1>
          <p style={{ fontSize: 13, color: T.textDim, margin: 0 }}>Hot called first, Warm second, Cold skipped.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {pendingAnalysisCount > 0 && (
            <button onClick={runAIAnalysis} disabled={analyzingAI}
              style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.accentBorder}`, background: T.accentBg, color: T.accent, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
              {analyzingAI ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={12} />}
              Analyze {pendingAnalysisCount} Websites
            </button>
          )}
          <button onClick={refreshAll}
            style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: T.textMuted, fontSize: 12, cursor: "pointer" }}>
            ↻ Refresh
          </button>
          {leads.length > 0 && (
            <button onClick={handleClearAll}
              style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.hotBorder}`, background: T.hotBg, color: T.hot, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
              <Trash2 size={12} /> Clear Table
            </button>
          )}
        </div>
      </div>

      <div onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          background: dragging ? T.accentBg : T.card,
          border: `2px dashed ${dragging ? T.accent : T.border}`,
          borderRadius: 12, padding: 32, marginBottom: 20, textAlign: "center", cursor: "pointer",
          transition: "all 0.15s",
        }}>
        <Upload size={28} color={dragging ? T.accent : T.textDim} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>
          {loading ? "Processing..." : dragging ? "Drop CSV here" : "Drag & drop CSV or click to browse"}
        </div>
        <div style={{ fontSize: 11, color: T.textDim }}>Auto-detects: Title, Phone, Industry, Website, Address, Reviews, Rating</div>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} style={{ display: "none" }} />
      </div>

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.textDim }} />
        <input
          type="text"
          placeholder="Search by business name, phone, address, niche, or website..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%", padding: "10px 14px 10px 38px",
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 10, color: T.text, fontSize: 13,
            outline: "none",
          }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.textDim, cursor: "pointer", padding: 4 }}>
            <XCircle size={14} />
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
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
        {searchQuery && (
          <span style={{ fontSize: 11, color: T.textDim, marginLeft: 8 }}>
            {filtered.length} match{filtered.length !== 1 ? "es" : ""} for "{searchQuery}"
          </span>
        )}
      </div>

      <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1.2fr 1.3fr 0.9fr 0.8fr 0.9fr 1fr 100px", padding: "14px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 10, color: T.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
          <div>Business</div><div>Phone</div><div>Website</div><div>Web Design</div><div>Rating</div><div>Reviews</div><div>Priority</div><div></div>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: 60, textAlign: "center", color: T.textDim, fontSize: 13 }}>
            {searchQuery ? `No leads match "${searchQuery}".` : `No leads ${filter !== "all" ? `with priority "${filter}"` : ""}. Upload a CSV to begin.`}
          </div>
        )}

        {filtered.map((lead: Lead) => {
          const p = priorityStyles[lead.priority] || priorityStyles.warm;
          const PIcon = p.icon;
          const ws = websiteStatusLabels[lead.website_status] || { label: lead.website_status, color: T.textDim, webDesign: "—" };
          const n = nicheColors[lead.niche] || nicheColors.Other;
          const isCold = lead.priority === "cold";
          const isPending = lead.website_status === "pending-analysis";

          // Web design pill
         let webDesignStyle = { bg: "#1f2235", text: T.textDim, border: T.border };
          let webDesignLabel = ws.webDesign;

          if (ws.webDesign === "None") {
            webDesignStyle = { bg: T.hotBg, text: T.hot, border: T.hotBorder };
          } else if (lead.design_score !== null && lead.design_score !== undefined) {
            const s = lead.design_score;
            if (s <= 3) {
              webDesignStyle = { bg: T.hotBg, text: T.hot, border: T.hotBorder };
              webDesignLabel = `Bad ${s}/10`;
            } else if (s <= 5) {
              webDesignStyle = { bg: T.warmBg, text: T.warm, border: T.warmBorder };
              webDesignLabel = `Average ${s}/10`;
            } else if (s <= 7) {
              webDesignStyle = { bg: T.greenBg, text: T.green, border: `${T.green}55` };
              webDesignLabel = `Good ${s}/10`;
            } else {
              webDesignStyle = { bg: T.accentBg, text: T.accent, border: T.accentBorder };
              webDesignLabel = `Excellent ${s}/10`;
            }
          } else if (isPending) {
            webDesignStyle = { bg: T.accentBg, text: T.accent, border: T.accentBorder };
            webDesignLabel = "...";
          }

          return (
            <div key={lead.id} style={{
              display: "grid", gridTemplateColumns: "2.5fr 1.2fr 1.3fr 0.9fr 0.8fr 0.9fr 1fr 100px",
              padding: "16px", borderBottom: `1px solid ${T.border}`,
              fontSize: 13, alignItems: "center",
              opacity: isCold ? 0.55 : 1,
              background: lead.priority === "hot" ? `${T.hotBg}33` : "transparent"
            }}>
              <div>
                <div style={{ fontWeight: 600, color: T.text, marginBottom: 4, lineHeight: 1.3 }}>{lead.business_name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ background: n.bg, color: n.text, fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 500 }}>{lead.niche}</span>
                  {lead.address && (
                    <span style={{ fontSize: 10, color: T.textVeryDim, display: "flex", alignItems: "center", gap: 3 }}>
                      <MapPin size={9} /> {lead.address.length > 30 ? lead.address.slice(0, 30) + "..." : lead.address}
                    </span>
                  )}
                </div>
                {lead.analysis_notes && (
                  <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.4, marginTop: 4, fontStyle: "italic" }}>
                    {lead.analysis_notes}
                  </div>
                )}
              </div>

              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: T.textMuted }}>{lead.phone}</div>

              <div>
                {lead.website && lead.website_status !== "none" ? (
                  <a href={lead.website} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: T.cold, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, wordBreak: "break-all" }}>
                    <ExternalLink size={10} /> {(lead.website || "").replace(/^https?:\/\//, "").replace(/^www\./, "").slice(0, 22)}{(lead.website || "").length > 22 ? "..." : ""}
                  </a>
                ) : (
                  <span style={{ fontSize: 11, color: ws.color, fontWeight: 600 }}>{ws.label}</span>
                )}
              </div>

              <div>
                <span style={{ background: webDesignStyle.bg, color: webDesignStyle.text, fontSize: 10, padding: "3px 9px", borderRadius: 12, fontWeight: 600, border: `1px solid ${webDesignStyle.border}`, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {isPending && <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} />}
                  {webDesignLabel}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: T.text }}>
                <Star size={11} fill={T.warm} color={T.warm} />
                <span style={{ fontWeight: 600 }}>{lead.rating || "—"}</span>
              </div>

              <div style={{ fontSize: 12, color: lead.reviews_count < 30 ? T.hot : T.textMuted, fontWeight: lead.reviews_count < 30 ? 600 : 400 }}>
                {lead.reviews_count}
              </div>

              <div>
                <span style={{ background: p.bg, color: p.text, fontSize: 11, padding: "5px 10px", borderRadius: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5, border: `1px solid ${p.border}` }}>
                  <PIcon size={11} /> {p.label}
                </span>
              </div>

              <div>
                {!isCold ? (
                  <button onClick={() => onCall(lead.id)} disabled={loading}
                    style={{ padding: "7px 12px", borderRadius: 6, border: `1px solid ${T.accentBorder}`, background: T.accentBg, color: T.accent, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
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

function HistoryTab({ calls, selectedCall, setSelectedCall }: any) {
  if (calls.length === 0) {
    return <div style={{ color: T.textDim, padding: 40, textAlign: "center", background: T.card, borderRadius: 12, border: `1px solid ${T.border}` }}>No calls yet. Hit "Start Calling" to begin.</div>;
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
