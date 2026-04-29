// app/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Phone, Upload, Users, History, BarChart3, Mic, TrendingUp, Play, Download, Clock, PhoneCall, XCircle, AlertCircle, Star, Calendar, Video, MessageCircle, Link2 } from "lucide-react";

// ---------- Types ----------
type Lead = {
  id: string;
  business_name: string;
  niche: string;
  contact_name: string;
  phone: string;
  gaps: string[];
  reviews_count: number;
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

// ---------- Style maps ----------
const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  "pending":         { bg: "#FAEEDA", text: "#854F0B", label: "Pending" },
  "called":          { bg: "#E6F1FB", text: "#0C447C", label: "Called" },
  "appointment":     { bg: "#E1F5EE", text: "#085041", label: "Appointment" },
  "call-back":       { bg: "#FAEEDA", text: "#854F0B", label: "Call back" },
  "not-interested":  { bg: "#FCEBEB", text: "#791F1F", label: "Not interested" },
  "no-answer":       { bg: "#F1EFE8", text: "#5F5E5A", label: "No answer" },
  "not-in-service":  { bg: "#FCEBEB", text: "#791F1F", label: "Not in service" },
};

const outcomeStyles: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  "appointment":     { bg: "#E1F5EE", text: "#085041", icon: Video,     label: "Appointment booked" },
  "call-back":       { bg: "#FAEEDA", text: "#854F0B", icon: Phone,     label: "Call back" },
  "not-interested":  { bg: "#FCEBEB", text: "#791F1F", icon: XCircle,   label: "Not interested" },
  "no-answer":       { bg: "#F1EFE8", text: "#5F5E5A", icon: PhoneCall, label: "No answer · auto-retry" },
  "not-in-service":  { bg: "#FCEBEB", text: "#791F1F", icon: XCircle,   label: "Not in service" },
  "called":          { bg: "#E6F1FB", text: "#0C447C", icon: AlertCircle, label: "Completed" },
};

const gapLabels: Record<string, { label: string; color: string; bg: string }> = {
  "no-website":      { label: "No website",          color: "#791F1F", bg: "#FCEBEB" },
  "outdated-site":   { label: "Outdated site",       color: "#854F0B", bg: "#FAEEDA" },
  "weak-gmb":        { label: "Weak GMB",            color: "#854F0B", bg: "#FAEEDA" },
  "few-reviews":     { label: "Few reviews",         color: "#0C447C", bg: "#E6F1FB" },
  "competitors-ads": { label: "Competitors on Ads",  color: "#791F1F", bg: "#FCEBEB" },
};

const nicheColors: Record<string, { bg: string; text: string }> = {
  "Dental":   { bg: "#EEEDFE", text: "#3C3489" },
  "Workshop": { bg: "#FAECE7", text: "#712B13" },
  "F&B":      { bg: "#FBEAF0", text: "#72243E" },
  "Other":    { bg: "#F1EFE8", text: "#444441" },
};

// ---------- Page ----------
export default function Page() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [selectedCall, setSelectedCall] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch data
  useEffect(() => {
    fetch("/api/leads").then(r => r.json()).then(d => setLeads(d.leads || []));
    fetch("/api/calls").then(r => r.json()).then(d => setCalls(d.calls || []));
  }, []);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "leads", label: "Leads", icon: Users },
    { id: "history", label: "Call History", icon: History },
    { id: "agent", label: "Agent Config", icon: Mic },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
  ];

  // Trigger a call
  async function handleCall(leadId: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Call started! Check Twilio dashboard for status.");
        // Refresh leads
        const refreshed = await fetch("/api/leads").then(r => r.json());
        setLeads(refreshed.leads || []);
      } else {
        alert("Call failed: " + (data.error || "unknown"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  }

  // CSV upload
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
      alert(`Imported ${data.count} leads`);
      const refreshed = await fetch("/api/leads").then(r => r.json());
      setLeads(refreshed.leads || []);
    } else {
      alert("Upload failed: " + data.error);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F1EFE8", color: "#2C2C2A" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid rgba(0,0,0,0.08)", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#185FA5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PhoneCall size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 15 }}>Sayothix Caller</div>
            <div style={{ fontSize: 11, color: "#5F5E5A" }}>AI agent · Aira · Johor Bahru</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 61px)" }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: "#fff", borderRight: "0.5px solid rgba(0,0,0,0.08)", padding: "20px 12px" }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  width: "100%", padding: "10px 12px", marginBottom: 2, borderRadius: 8,
                  border: "none", background: active ? "#F1EFE8" : "transparent",
                  color: active ? "#2C2C2A" : "#5F5E5A",
                  fontSize: 13, fontWeight: active ? 500 : 400, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                }}>
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: 28, overflow: "auto" }}>
          {activeTab === "dashboard" && <DashboardTab leads={leads} calls={calls} />}
          {activeTab === "leads" && <LeadsTab leads={leads} onCall={handleCall} onUpload={handleCSVUpload} loading={loading} />}
          {activeTab === "history" && <HistoryTab calls={calls} selectedCall={selectedCall} setSelectedCall={setSelectedCall} />}
          {activeTab === "agent" && <AgentTab />}
          {activeTab === "analytics" && <AnalyticsTab calls={calls} />}
        </div>
      </div>
    </div>
  );
}

// ---------- Tab: Dashboard ----------
function DashboardTab({ leads, calls }: { leads: Lead[]; calls: Call[] }) {
  const today = new Date().toDateString();
  const todaysCalls = calls.filter(c => new Date(c.created_at).toDateString() === today);
  const appointments = calls.filter(c => c.outcome === "appointment").length;
  const connected = calls.filter(c => c.duration_seconds > 10).length;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px" }}>Selamat petang</h1>
      <p style={{ fontSize: 13, color: "#5F5E5A", margin: "0 0 24px" }}>Aira's been busy. Here's today's progress.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Calls today", value: todaysCalls.length },
          { label: "Connected", value: connected },
          { label: "Appointments booked", value: appointments },
          { label: "Total leads", value: leads.length },
        ].map((m, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: "0.5px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, color: "#5F5E5A", marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 26, fontWeight: 500 }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Tab: Leads ----------
function LeadsTab({ leads, onCall, onUpload, loading }: any) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px" }}>Leads</h1>
          <p style={{ fontSize: 13, color: "#5F5E5A", margin: 0 }}>{leads.length} JB businesses</p>
        </div>
      </div>

      <label style={{ display: "block", background: "#fff", border: "1.5px dashed rgba(0,0,0,0.15)", borderRadius: 12, padding: 24, marginBottom: 20, textAlign: "center", cursor: "pointer" }}>
        <Upload size={20} color="#5F5E5A" style={{ marginBottom: 8 }} />
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{loading ? "Uploading..." : "Click to upload CSV"}</div>
        <div style={{ fontSize: 11, color: "#5F5E5A" }}>Columns: business_name, niche, contact_name, phone, gaps, reviews_count</div>
        <input type="file" accept=".csv" onChange={onUpload} style={{ display: "none" }} />
      </label>

      <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.3fr 2fr 0.8fr 1fr 80px", padding: "12px 16px", borderBottom: "0.5px solid rgba(0,0,0,0.06)", fontSize: 11, color: "#5F5E5A", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>
          <div>Business</div><div>Niche</div><div>Phone</div><div>Gaps</div><div>Reviews</div><div>Status</div><div></div>
        </div>
        {leads.map((lead: Lead) => {
          const s = statusStyles[lead.status] || statusStyles.pending;
          const n = nicheColors[lead.niche] || nicheColors.Other;
          return (
            <div key={lead.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.3fr 2fr 0.8fr 1fr 80px", padding: "14px 16px", borderBottom: "0.5px solid rgba(0,0,0,0.06)", fontSize: 13, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 500 }}>{lead.business_name}</div>
                <div style={{ fontSize: 11, color: "#5F5E5A" }}>{lead.contact_name}</div>
              </div>
              <div><span style={{ background: n.bg, color: n.text, fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 500 }}>{lead.niche}</span></div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{lead.phone}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {lead.gaps?.map(g => {
                  const gl = gapLabels[g];
                  if (!gl) return null;
                  return <span key={g} style={{ background: gl.bg, color: gl.color, fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 500 }}>{gl.label}</span>;
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: lead.reviews_count < 10 ? "#791F1F" : "#5F5E5A" }}>
                <Star size={11} /> {lead.reviews_count}
              </div>
              <div><span style={{ background: s.bg, color: s.text, fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 500 }}>{s.label}</span></div>
              <div>
                <button onClick={() => onCall(lead.id)} disabled={loading}
                  style={{ padding: "5px 10px", borderRadius: 6, border: "0.5px solid rgba(0,0,0,0.15)", background: "#fff", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <Phone size={11} /> Call
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Tab: Call History ----------
function HistoryTab({ calls, selectedCall, setSelectedCall }: any) {
  if (calls.length === 0) {
    return <div style={{ color: "#5F5E5A" }}>No calls yet. Make your first call from the Leads tab.</div>;
  }
  const call = calls[selectedCall];
  const o = outcomeStyles[call.outcome] || outcomeStyles.called;
  const OutcomeIcon = o.icon;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px" }}>Call History</h1>
      <p style={{ fontSize: 13, color: "#5F5E5A", margin: "0 0 20px" }}>Review what Aira said and what the lead said back.</p>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
          {calls.map((c: Call, i: number) => {
            const co = outcomeStyles[c.outcome] || outcomeStyles.called;
            const Icon = co.icon;
            const active = selectedCall === i;
            return (
              <button key={c.id} onClick={() => setSelectedCall(i)}
                style={{ width: "100%", padding: "14px 16px", border: "none", borderBottom: "0.5px solid rgba(0,0,0,0.06)", background: active ? "#F1EFE8" : "#fff", cursor: "pointer", textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{c.business_name || "Unknown"}</div>
                  <Icon size={14} color={co.text} />
                </div>
                <div style={{ fontSize: 11, color: "#5F5E5A" }}>{c.contact_name} · {c.niche}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5F5E5A", marginTop: 4 }}>
                  <span>{new Date(c.created_at).toLocaleString()}</span>
                  <span><Clock size={10} /> {Math.floor(c.duration_seconds / 60)}:{String(c.duration_seconds % 60).padStart(2, "0")}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid rgba(0,0,0,0.06)", padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, paddingBottom: 16, borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 16, marginBottom: 4 }}>{call.business_name}</div>
              <div style={{ fontSize: 12, color: "#5F5E5A" }}>{call.contact_name} · {new Date(call.created_at).toLocaleString()}</div>
            </div>
          </div>

          {/* Transcript */}
          <div style={{ marginBottom: 20 }}>
            {call.transcript?.map((line: any, i: number) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: line.speaker === "agent" ? "#185FA5" : "#9FE1CB", color: line.speaker === "agent" ? "#fff" : "#085041", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 500, flexShrink: 0 }}>
                  {line.speaker === "agent" ? "A" : "L"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#5F5E5A", marginBottom: 2, fontWeight: 500 }}>{line.speaker === "agent" ? "Aira" : call.contact_name}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>{line.text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Outcome footer */}
          <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)", paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: "#5F5E5A", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Call Outcome</div>
            <div style={{ background: o.bg, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <OutcomeIcon size={18} color={o.text} />
                <div style={{ fontSize: 15, fontWeight: 500, color: o.text }}>{o.label}</div>
              </div>
              {call.notes && <div style={{ fontSize: 12, color: o.text, marginBottom: 12, opacity: 0.85 }}>{call.notes}</div>}

              {call.outcome === "appointment" && (
                <div style={{ background: "#fff", borderRadius: 8, padding: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#5F5E5A", textTransform: "uppercase", marginBottom: 3 }}>When</div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{call.meeting_time}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#5F5E5A", textTransform: "uppercase", marginBottom: 3 }}>Google Meet</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#185FA5" }}>{call.meet_link}</div>
                    </div>
                  </div>
                  {call.whatsapp_sent && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#E1F5EE", borderRadius: 6 }}>
                      <MessageCircle size={13} color="#085041" />
                      <div style={{ fontSize: 11, color: "#085041", fontWeight: 500 }}>WhatsApp sent to you ✓</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Tab: Agent Config ----------
function AgentTab() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px" }}>Agent Configuration</h1>
      <p style={{ fontSize: 13, color: "#5F5E5A", margin: "0 0 20px" }}>Aira's settings (configured in Vapi dashboard).</p>

      <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "0.5px solid rgba(0,0,0,0.06)", marginBottom: 16 }}>
        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 14 }}>Language Rules</div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#791F1F", marginBottom: 6, fontWeight: 500 }}>NEVER SAY</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {["SEO", "rankings", "backlinks", "domain authority", "digital marketing", "online presence"].map(w => (
              <span key={w} style={{ background: "#FCEBEB", color: "#791F1F", fontSize: 11, padding: "3px 8px", borderRadius: 4 }}>{w}</span>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#085041", marginBottom: 6, fontWeight: 500 }}>ALWAYS SAY</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {["get more customer enquiries", "help people find you on Google", "more customers calling", "find you on Google Maps"].map(w => (
              <span key={w} style={{ background: "#E1F5EE", color: "#085041", fontSize: 11, padding: "3px 8px", borderRadius: 4 }}>{w}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Tab: Analytics ----------
function AnalyticsTab({ calls }: { calls: Call[] }) {
  const total = calls.length || 1;
  const connected = calls.filter(c => c.duration_seconds > 10).length;
  const pitched = calls.filter(c => c.duration_seconds > 30).length;
  const booked = calls.filter(c => c.outcome === "appointment").length;

  const funnel = [
    { label: "Dialed", value: total, pct: 100, color: "#2C2C2A" },
    { label: "Connected", value: connected, pct: Math.round(connected / total * 100), color: "#185FA5" },
    { label: "Pitched", value: pitched, pct: Math.round(pitched / total * 100), color: "#1D9E75" },
    { label: "Appointment booked", value: booked, pct: Math.round(booked / total * 100), color: "#085041" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px" }}>Analytics</h1>
      <p style={{ fontSize: 13, color: "#5F5E5A", margin: "0 0 20px" }}>Funnel from dial to booked meeting.</p>
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: "0.5px solid rgba(0,0,0,0.06)" }}>
        {funnel.map((row, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span>{row.label}</span><span style={{ color: "#5F5E5A" }}>{row.value} · {row.pct}%</span>
            </div>
            <div style={{ height: 8, background: "#F1EFE8", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${row.pct}%`, background: row.color }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
