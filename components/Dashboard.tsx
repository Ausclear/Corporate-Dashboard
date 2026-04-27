"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

const GOLD = "#c9a84c";
const GOLD_DIM = "rgba(201,168,76,0.15)";
const GOLD_BORDER = "rgba(201,168,76,0.25)";
const BG = "#07070a";
const CARD = "#202028";
const INPUT = "#16161c";
const TEXT = "#e8e6e1";
const TEXT2 = "#9a9898";
const MUTED = "#6b6969";
const BORDER = "rgba(255,255,255,0.06)";
const GREEN = "#27ae60";
const GREEN_DIM = "rgba(39,174,96,0.12)";
const AMBER = "#e67e22";
const AMBER_DIM = "rgba(230,126,34,0.12)";
const RED = "#c0392b";
const RED_DIM = "rgba(192,57,43,0.12)";
const BLUE = "#7eb8da";

type Company = {
  company_name: string; abn: string; client_ref: string; status: string; tier: string | null;
  contract_start: string | null; contract_expiry: string | null;
  baseline_total: number; nv1_total: number; nv2_total: number;
  total_nominees: number; pending_applications: number; monthly_spend: string;
  email: string; phone: string;
};
type Personnel = {
  id: string; employee_name: string; email: string; clearance_type: string;
  request_type: string; stage: string; status: string;
  agsva_granted_date: string | null; revalidation_date: string | null;
  sponsorship_renewal: string | null; deal_reference: string | null; mobile: string | null;
};
type Activity = {
  id: string; employee_name: string; event: string; event_type: string; event_date: string;
};
type DashData = {
  company: Company; personnel: Personnel[]; activity: Activity[];
  user: { email: string; display_name: string; role: string };
};

const clearanceColour = (c: string) => c === "NV2" ? GOLD : c === "NV1" ? BLUE : TEXT2;
const clearanceBg = (c: string) => c === "NV2" ? GOLD_DIM : c === "NV1" ? "rgba(126,184,218,0.12)" : "rgba(255,255,255,0.06)";
const statusColour = (s: string) => s === "active" ? GREEN : s === "pending" ? AMBER : RED;
const statusBg = (s: string) => s === "active" ? GREEN_DIM : s === "pending" ? AMBER_DIM : RED_DIM;
const activityColour = (t: string) => t === "granted" ? GREEN : t === "application" ? GOLD : t === "renewal" ? AMBER : TEXT2;

function Badge({ text, colour, bg }: { text: string; colour: string; bg: string }) {
  return <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: colour, background: bg, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{text}</span>;
}

const Icons = {
  dashboard: (c = MUTED) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  personnel: (c = MUTED) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  activity: (c = MUTED) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  support: (c = MUTED) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  search: (c = MUTED) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  logout: (c = MUTED) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevronRight: (c = MUTED) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  close: (c = TEXT2) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: Icons.dashboard },
  { key: "personnel", label: "Personnel", icon: Icons.personnel },
  { key: "activity", label: "Activity", icon: Icons.activity },
  { key: "support", label: "Support", icon: Icons.support },
];

export default function Dashboard() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [personnelFilter, setPersonnelFilter] = useState("All");
  const [selectedPerson, setSelectedPerson] = useState<Personnel | null>(null);
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    fetch("/api/dashboard/data")
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = () => { router.push("/logout"); };

  const userInitials = (() => {
    if (data?.user?.display_name) {
      const parts = data.user.display_name.trim().split(" ");
      return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
    }
    if (data?.user?.email) {
      const prefix = data.user.email.split("@")[0];
      const parts = prefix.split(/[._-]/);
      return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : prefix.slice(0, 2).toUpperCase();
    }
    return "··";
  })();

  const co = data?.company;
  const personnel = data?.personnel || [];
  const activity = data?.activity || [];

  const filteredPersonnel = personnel.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = p.employee_name.toLowerCase().includes(q) || (p.clearance_type || "").toLowerCase().includes(q);
    const matchFilter = personnelFilter === "All"
      || p.clearance_type === personnelFilter
      || (personnelFilter === "Active" && p.status === "active")
      || (personnelFilter === "Pending" && p.status === "pending");
    return matchSearch && matchFilter;
  });

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return d; }
  };

  const formatClearance = (c: string) => (!c || c === "Unknown") ? "—" : c;

  /* ── LOADING ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${BORDER}`, borderTopColor: GOLD, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: TEXT2, fontSize: 14 }}>Loading your dashboard...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: CARD, borderRadius: 16, padding: 32, border: `1px solid ${BORDER}`, textAlign: "center", maxWidth: 380 }}>
        <p style={{ color: RED, fontSize: 14, marginBottom: 16 }}>{error}</p>
        <button onClick={() => router.push("/login")} style={{ background: `linear-gradient(135deg, ${GOLD}, #b8942e)`, border: "none", borderRadius: 10, padding: "12px 24px", color: BG, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Back to Login</button>
      </div>
    </div>
  );

  /* ── PERSONNEL DRAWER ── */
  const PersonnelDrawer = () => {
    if (!selectedPerson) return null;
    const p = selectedPerson;
    return (
      <>
        {/* Overlay */}
        <div onClick={() => setSelectedPerson(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, backdropFilter: "blur(4px)" }} />
        {/* Drawer */}
        <div style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: isMobile ? "100%" : 400,
          background: CARD, zIndex: 201, borderLeft: `1px solid ${BORDER}`,
          overflowY: "auto", display: "flex", flexDirection: "column",
          animation: "slideIn 0.25s ease-out",
        }}>
          {/* Gold top bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />

          {/* Header */}
          <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, color: TEXT, margin: 0, fontWeight: 700 }}>{p.employee_name}</h2>
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge text={formatClearance(p.clearance_type)} colour={clearanceColour(p.clearance_type)} bg={clearanceBg(p.clearance_type)} />
                <Badge text={p.status} colour={statusColour(p.status)} bg={statusBg(p.status)} />
              </div>
            </div>
            <button onClick={() => setSelectedPerson(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, marginTop: 2 }}>
              {Icons.close()}
            </button>
          </div>

          {/* Details */}
          <div style={{ padding: "24px", flex: 1 }}>
            {[
              { label: "Clearance Level", value: formatClearance(p.clearance_type) },
              { label: "Application Type", value: p.request_type || "—" },
              { label: "Current Stage", value: p.stage || "—" },
              { label: "Status", value: p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : "—" },
              { label: "Email Address", value: p.email || "—" },
              { label: "Mobile", value: p.mobile || "—" },
              { label: "Deal Reference", value: p.deal_reference || "—" },
              { label: "AGSVA Granted", value: formatDate(p.agsva_granted_date) },
              { label: "Revalidation Date", value: formatDate(p.revalidation_date) },
              { label: "Sponsorship Renewal", value: formatDate(p.sponsorship_renewal) },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 14, color: item.value === "—" ? MUTED : TEXT, fontFamily: item.label.includes("Reference") ? "monospace" : "inherit" }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Footer contact AusClear */}
          <div style={{ padding: "16px 24px 24px", borderTop: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 11, color: MUTED, margin: "0 0 8px" }}>To update details or request changes:</p>
            <p style={{ fontSize: 12, color: TEXT2, margin: 0 }}>
              <span style={{ color: GOLD }}>1300 027 423</span> &nbsp;·&nbsp; support@ausclear.com.au
            </p>
          </div>
        </div>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      </>
    );
  };

  /* ── DASHBOARD PAGE ── */
  const renderDashboard = () => (
    <div>
      <div style={{ background: CARD, borderRadius: 14, padding: isMobile ? "20px 16px" : "28px 28px 24px", border: `1px solid ${BORDER}`, position: "relative", overflow: "hidden", marginBottom: 16 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: isMobile ? 18 : 22, color: TEXT, fontWeight: 700, margin: 0 }}>{co?.company_name || "—"}</h2>
            <div style={{ fontSize: 12, color: TEXT2, marginTop: 6 }}>
              {co?.abn && <>ABN {co.abn} &nbsp;·&nbsp;</>}
              Ref: <span style={{ color: GOLD, fontFamily: "monospace", fontWeight: 700 }}>{co?.client_ref || "—"}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Badge text={co?.status === "active" ? "Active" : co?.status || "—"} colour={GREEN} bg={GREEN_DIM} />
            {co?.tier && <Badge text={co.tier} colour={GOLD} bg={GOLD_DIM} />}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 14, fontSize: 12, color: TEXT2, flexWrap: "wrap" }}>
          {co?.contract_start && <span>Contract: {formatDate(co.contract_start)} — {formatDate(co.contract_expiry)}</span>}
          {co?.monthly_spend && <><span style={{ color: MUTED }}>|</span><span>Monthly: <span style={{ color: GOLD, fontWeight: 700 }}>{co.monthly_spend}</span></span></>}
        </div>
        <button
          onClick={() => { setPage("personnel"); }}
          style={{ background: `linear-gradient(135deg, ${GOLD}, #b8942e)`, border: "none", borderRadius: 8, padding: "10px 20px", color: BG, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 16 }}>
          + Nominate Personnel
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total", value: co?.total_nominees ?? 0, accent: GOLD },
          { label: "Baseline", value: co?.baseline_total ?? 0, accent: TEXT2 },
          { label: "NV1", value: co?.nv1_total ?? 0, accent: BLUE },
          { label: "NV2", value: co?.nv2_total ?? 0, accent: GOLD },
          { label: "Pending", value: co?.pending_applications ?? 0, accent: AMBER },
        ].map((s, i) => (
          <div key={i} style={{ background: CARD, borderRadius: 12, padding: "16px 14px", border: `1px solid ${BORDER}`, position: "relative", overflow: "hidden", gridColumn: isMobile && i === 4 ? "1 / -1" : undefined }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.accent }} />
            <div style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: TEXT, lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: TEXT2, marginTop: 4, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {(co?.total_nominees ?? 0) > 0 && (
        <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: isMobile ? "16px" : "22px 24px", marginBottom: 16 }}>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: 15, color: TEXT, margin: "0 0 12px", fontWeight: 700 }}>Clearance Distribution</h3>
          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 28 }}>
            {[
              { pct: ((co?.baseline_total ?? 0) / (co?.total_nominees ?? 1)) * 100, label: "BL", bg: TEXT2 },
              { pct: ((co?.nv1_total ?? 0) / (co?.total_nominees ?? 1)) * 100, label: "NV1", bg: BLUE },
              { pct: ((co?.nv2_total ?? 0) / (co?.total_nominees ?? 1)) * 100, label: "NV2", bg: GOLD },
            ].filter(b => b.pct > 0).map((b, i) => (
              <div key={i} style={{ width: `${b.pct}%`, background: b.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: BG }}>{b.label}</div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: isMobile ? "16px" : "22px 24px" }}>
        <h3 style={{ fontFamily: "Georgia, serif", fontSize: 15, color: TEXT, margin: "0 0 14px", fontWeight: 700 }}>Recent Activity</h3>
        {activity.length === 0 ? <p style={{ color: MUTED, fontSize: 13 }}>No activity recorded yet.</p>
          : activity.slice(0, 6).map((a, i) => (
            <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: i < Math.min(activity.length, 6) - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: activityColour(a.event_type), marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{a.event}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{formatDate(a.event_date)}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  /* ── PERSONNEL PAGE ── */
  const renderPersonnel = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: isMobile ? 18 : 20, color: TEXT, margin: 0, fontWeight: 700 }}>Sponsored Personnel</h2>
        <button style={{ background: `linear-gradient(135deg, ${GOLD}, #b8942e)`, border: "none", borderRadius: 8, padding: "10px 18px", color: BG, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          + Nominate
        </button>
      </div>
      <div style={{ position: "relative", marginBottom: 10 }}>
        <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>{Icons.search(MUTED)}</div>
        <input type="text" placeholder="Search personnel..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          style={{ width: "100%", background: INPUT, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px 10px 40px", color: TEXT, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
        {["All", "Baseline", "NV1", "NV2", "Active", "Pending"].map(f => (
          <button key={f} onClick={() => setPersonnelFilter(f)} style={{ background: personnelFilter === f ? GOLD_DIM : INPUT, border: `1px solid ${personnelFilter === f ? GOLD_BORDER : BORDER}`, borderRadius: 8, padding: "8px 14px", color: personnelFilter === f ? GOLD : TEXT2, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", flexShrink: 0 }}>{f}</button>
        ))}
      </div>

      {/* Personnel list — clickable rows open drawer */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredPersonnel.map(p => (
            <div key={p.id} onClick={() => setSelectedPerson(p)} style={{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "16px", position: "relative", overflow: "hidden", cursor: "pointer" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: clearanceColour(p.clearance_type) }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, color: TEXT, fontWeight: 700 }}>{p.employee_name}</div>
                  <div style={{ fontSize: 12, color: TEXT2, marginTop: 2 }}>{p.stage || "—"}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <Badge text={p.status} colour={statusColour(p.status)} bg={statusBg(p.status)} />
                  {Icons.chevronRight(MUTED)}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Badge text={formatClearance(p.clearance_type)} colour={clearanceColour(p.clearance_type)} bg={clearanceBg(p.clearance_type)} />
                <span style={{ fontSize: 11, color: MUTED }}>Exp: {formatDate(p.revalidation_date)}</span>
              </div>
            </div>
          ))}
          {filteredPersonnel.length === 0 && <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>No personnel match your search.</div>}
        </div>
      ) : (
        <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1fr 32px", padding: "14px 22px", borderBottom: `1px solid ${BORDER}`, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: MUTED }}>
            <span>Name</span><span>Clearance</span><span>Status</span><span>Stage</span><span>Expires</span><span></span>
          </div>
          {filteredPersonnel.map((p, i) => (
            <div key={p.id} onClick={() => setSelectedPerson(p)} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1fr 32px", padding: "14px 22px", borderBottom: i < filteredPersonnel.length - 1 ? `1px solid ${BORDER}` : "none", alignItems: "center", cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}>
              <div>
                <div style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{p.employee_name}</div>
                {p.email && <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{p.email}</div>}
              </div>
              <span><Badge text={formatClearance(p.clearance_type)} colour={clearanceColour(p.clearance_type)} bg={clearanceBg(p.clearance_type)} /></span>
              <span><Badge text={p.status} colour={statusColour(p.status)} bg={statusBg(p.status)} /></span>
              <span style={{ fontSize: 12, color: TEXT2 }}>{p.stage || "—"}</span>
              <span style={{ fontSize: 12, color: MUTED, fontFamily: "monospace" }}>{formatDate(p.revalidation_date)}</span>
              <span style={{ display: "flex", justifyContent: "flex-end" }}>{Icons.chevronRight(MUTED)}</span>
            </div>
          ))}
          {filteredPersonnel.length === 0 && <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>No personnel match your search.</div>}
        </div>
      )}
    </div>
  );

  /* ── ACTIVITY PAGE ── */
  const renderActivity = () => (
    <div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: isMobile ? 18 : 20, color: TEXT, margin: "0 0 14px", fontWeight: 700 }}>Activity Log</h2>
      <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
        {activity.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>No activity recorded yet.</div>
          : activity.map((a, i) => (
            <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: isMobile ? "14px 16px" : "16px 24px", borderBottom: i < activity.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: `${activityColour(a.event_type)}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: activityColour(a.event_type) }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{a.event}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{formatDate(a.event_date)}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  /* ── SUPPORT PAGE ── */
  const renderSupport = () => (
    <div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: isMobile ? 18 : 20, color: TEXT, margin: "0 0 6px", fontWeight: 700 }}>Support</h2>
      <p style={{ fontSize: 13, color: TEXT2, margin: "0 0 14px" }}>Get in touch with your AusClear account team.</p>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: isMobile ? "20px 16px" : "28px 24px" }}>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: 16, color: TEXT, margin: "0 0 14px", fontWeight: 700 }}>Contact Details</h3>
          {[
            { label: "Phone", value: "1300 027 423" },
            { label: "Email", value: "support@ausclear.com.au" },
            { label: "Hours", value: "Mon — Fri, 9am — 5pm ACST" },
            { label: "Address", value: "82 Onkaparinga Valley Road, Woodside SA 5244" },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "1.5px", color: GOLD, fontWeight: 700, marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: TEXT }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: isMobile ? "20px 16px" : "28px 24px" }}>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: 16, color: TEXT, margin: "0 0 14px", fontWeight: 700 }}>Knowledge Base</h3>
          <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.5, margin: "0 0 20px" }}>Browse 120+ articles on security clearances, AGSVA processes, and DISP requirements.</p>
          <a href="https://support.cfirst.com.au" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <button style={{ background: `linear-gradient(135deg, ${GOLD}, #b8942e)`, border: "none", borderRadius: 8, padding: "12px 22px", color: BG, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Visit Knowledge Base</button>
          </a>
        </div>
      </div>
    </div>
  );

  const content: Record<string, () => React.ReactElement> = {
    dashboard: renderDashboard, personnel: renderPersonnel,
    activity: renderActivity, support: renderSupport,
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontSize: 14, overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Personnel drawer */}
      <PersonnelDrawer />

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 99 }} />}

      {/* Sidebar */}
      <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 240, background: CARD, zIndex: 100, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)", overflowY: "auto" }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <img src="https://ausclear.au/AusClear-Light-Transparent.png" alt="AusClear" style={{ height: 28 }} />
          <div style={{ fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700, marginTop: 6 }}>Corporate Portal</div>
        </div>
        {data?.user && (
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, background: "rgba(201,168,76,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: GOLD, flexShrink: 0 }}>{userInitials}</div>
              <div style={{ minWidth: 0 }}>
                {co?.company_name && <div style={{ fontSize: 12, color: GOLD, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{co.company_name}</div>}
                <div style={{ fontSize: 11, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.user.email}</div>
              </div>
            </div>
          </div>
        )}
        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {NAV_ITEMS.map(item => {
            const active = page === item.key;
            return (
              <button key={item.key} onClick={() => { setPage(item.key); setSidebarOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", borderRadius: 10, border: "none", background: active ? GOLD_DIM : "transparent", color: active ? GOLD : TEXT2, fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "inherit", textAlign: "left", marginBottom: 2 }}>
                {item.icon(active ? GOLD : MUTED)}{item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "12px 10px 20px", borderTop: `1px solid ${BORDER}` }}>
          <button onClick={() => { handleSignOut(); setSidebarOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", borderRadius: 10, border: "none", background: "transparent", color: TEXT2, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
            {Icons.logout(MUTED)} Sign Out
          </button>
        </div>
      </div>

      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: `${CARD}ee`, backdropFilter: "blur(16px)", borderBottom: `1px solid ${BORDER}`, padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={TEXT2} strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: TEXT, fontWeight: 700 }}>{NAV_ITEMS.find(n => n.key === page)?.label || "Dashboard"}</span>
        </div>
        <button onClick={handleSignOut} style={{ width: 34, height: 34, borderRadius: "50%", background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: "Georgia, serif", cursor: "pointer" }}>{userInitials}</button>
      </div>

      <main style={{ padding: isMobile ? "16px 12px 80px" : "24px 24px 60px", maxWidth: 1100, margin: "0 auto" }}>
        {content[page]?.()}
      </main>

    </div>
  );
}