"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

const G = "#c9a84c", GD = "rgba(201,168,76,0.15)", GB = "rgba(201,168,76,0.25)";
const BG = "#07070a", CARD = "#202028", INPUT = "#16161c";
const TEXT = "#e8e6e1", TEXT2 = "#9a9898", MUTED = "#6b6969";
const BORDER = "rgba(255,255,255,0.06)";
const GREEN = "#27ae60", GND = "rgba(39,174,96,0.12)", GNB = "rgba(39,174,96,0.3)";
const AMBER = "#e67e22", AMD = "rgba(230,126,34,0.12)";
const RED = "#c0392b", RDD = "rgba(192,57,43,0.12)";
const BLUE = "#7eb8da", BLD = "rgba(126,184,218,0.12)";

const fmt = (n: number | null | undefined) =>
  n != null ? `$${Number(n).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

const clrColour = (c: string) => c?.includes("NV2") ? G : c?.includes("NV1") ? BLUE : TEXT2;
const clrBg = (c: string) => c?.includes("NV2") ? GD : c?.includes("NV1") ? BLD : "rgba(255,255,255,0.06)";
const clrLabel = (c: string) => c?.includes("NV2") ? "NV2" : c?.includes("NV1") ? "NV1" : c?.includes("Baseline") ? "BL" : "—";
const stColour = (s: string) => s === "active" ? GREEN : s === "pending" ? AMBER : RED;
const stBg = (s: string) => s === "active" ? GND : s === "pending" ? AMD : RDD;

function Badge({ text, colour, bg }: { text: string; colour: string; bg: string }) {
  return <span style={{ display:"inline-block", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", color:colour, background:bg, padding:"3px 10px", borderRadius:20, whiteSpace:"nowrap" }}>{text}</span>;
}

const NAV = [
  { key:"dashboard", label:"Dashboard" },
  { key:"personnel", label:"Personnel" },
  { key:"financials", label:"Financials" },
  { key:"activity", label:"Activity" },
  { key:"support", label:"Support" },
];

type Co = {
  company_name: string; abn: string; client_ref: string; status: string; tier: string|null;
  contract_start: string|null; contract_expiry: string|null; monthly_spend: string;
  email: string; phone: string; books_customer_number: string;
  total_nominees: number; new_total: number; upgrade_total: number; transfer_total: number;
  baseline_total: number; nv1_total: number; nv2_total: number; pending_applications: number;
  total_agsva_fees: number; total_application_fees: number; total_sponsorship_fees: number;
  total_fees_minus_agsva: number; overall_progress: number;
};
type P = {
  id: string; employee_name: string; first_name: string; last_name: string;
  email: string; mobile: string; clearance_type: string; clearance_request_type: string;
  stage: string; status: string; batch_date: string|null; onboarding_status: string|null;
  employee_number: number|null; linked_deal_name: string|null; revalidation_date: string|null;
};
type A = { id: string; employee_name: string; event: string; event_type: string; event_date: string; };
type Data = { company: Co; personnel: P[]; activity: A[]; user: { email: string; display_name: string; role: string } };

export default function Dashboard() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedP, setSelectedP] = useState<P|null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [data, setData] = useState<Data|null>(null);
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
    fetch("/api/dashboard/data").then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = () => router.push("/logout");

  const userInitials = (() => {
    const n = data?.user?.display_name || data?.user?.email?.split("@")[0] || "";
    const p = n.trim().split(/[ ._-]/);
    return p.length >= 2 ? (p[0][0] + p[p.length-1][0]).toUpperCase() : n.slice(0,2).toUpperCase();
  })();

  const fmtDate = (d: string|null) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-AU", { day:"2-digit", month:"short", year:"numeric" }); }
    catch { return d; }
  };

  const daysAgo = (d: string|null) => {
    if (!d) return null;
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    return diff === 0 ? "Today" : diff === 1 ? "1 day ago" : `${diff} days ago`;
  };

  const co = data?.company;
  const personnel = data?.personnel || [];
  const activity = data?.activity || [];

  if (loading) return (
    <div style={{ minHeight:"100vh", background:BG, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:40, height:40, border:`3px solid ${BORDER}`, borderTopColor:G, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }} />
        <p style={{ color:TEXT2, fontSize:14 }}>Loading your dashboard...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:"100vh", background:BG, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:CARD, borderRadius:16, padding:32, border:`1px solid ${BORDER}`, textAlign:"center", maxWidth:380 }}>
        <p style={{ color:RED, fontSize:14, marginBottom:16 }}>{error}</p>
        <button onClick={() => router.push("/login")} style={{ background:`linear-gradient(135deg,${G},#b8942e)`, border:"none", borderRadius:10, padding:"12px 24px", color:BG, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Back to Login</button>
      </div>
    </div>
  );

  // ── PERSONNEL DRAWER ─────────────────────────────────────────────────────
  const Drawer = () => {
    if (!selectedP) return null;
    const p = selectedP;
    return (
      <>
        <div onClick={() => setSelectedP(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:200, backdropFilter:"blur(4px)" }} />
        <div style={{ position:"fixed", top:0, right:0, bottom:0, width:isMobile?"100%":420, background:CARD, zIndex:201, borderLeft:`1px solid ${BORDER}`, overflowY:"auto", display:"flex", flexDirection:"column", animation:"slideIn 0.25s ease-out" }}>
          <div style={{ height:3, background:`linear-gradient(90deg,${G},transparent)` }} />
          <div style={{ padding:"20px 24px 16px", borderBottom:`1px solid ${BORDER}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <h2 style={{ fontFamily:"Georgia,serif", fontSize:18, color:TEXT, margin:"0 0 8px", fontWeight:700 }}>{p.employee_name}</h2>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <Badge text={clrLabel(p.clearance_type)} colour={clrColour(p.clearance_type)} bg={clrBg(p.clearance_type)} />
                <Badge text={p.clearance_request_type || "New"} colour={G} bg={GD} />
                <Badge text={p.status} colour={stColour(p.status)} bg={stBg(p.status)} />
              </div>
            </div>
            <button onClick={() => setSelectedP(null)} style={{ background:"none", border:"none", cursor:"pointer", color:TEXT2, fontSize:20, padding:4, lineHeight:1 }}>✕</button>
          </div>
          <div style={{ padding:24, flex:1 }}>
            {[
              { label:"Full Name", value:p.employee_name },
              { label:"Email", value:p.email || "—" },
              { label:"Mobile", value:p.mobile || "—" },
              { label:"Clearance Level", value:p.clearance_type || "—" },
              { label:"Request Type", value:p.clearance_request_type || "New" },
              { label:"Current Stage", value:p.stage || "—" },
              { label:"Onboarding Status", value:p.onboarding_status || "—" },
              { label:"Batch Date", value:fmtDate(p.batch_date) },
              { label:"Revalidation Due", value:fmtDate(p.revalidation_date) },
              { label:"Linked Deal", value:p.linked_deal_name || "—" },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom:18 }}>
                <div style={{ fontSize:10, color:G, textTransform:"uppercase", letterSpacing:"1.5px", fontWeight:700, marginBottom:4 }}>{item.label}</div>
                <div style={{ fontSize:13, color:item.value==="—"?MUTED:TEXT }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={{ padding:"16px 24px 24px", borderTop:`1px solid ${BORDER}` }}>
            <p style={{ fontSize:11, color:MUTED, margin:"0 0 6px" }}>To update or request changes:</p>
            <p style={{ fontSize:12, color:TEXT2, margin:0 }}><span style={{ color:G }}>1300 027 423</span> &nbsp;·&nbsp; support@ausclear.com.au</p>
          </div>
        </div>
        <style>{`@keyframes slideIn { from { transform:translateX(100%); } to { transform:translateX(0); } }`}</style>
      </>
    );
  };

  // ── DASHBOARD ────────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <div>
      <div style={{ background:CARD, borderRadius:14, padding:isMobile?"20px 16px":"28px 28px 24px", border:`1px solid ${BORDER}`, position:"relative", overflow:"hidden", marginBottom:16 }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${G},transparent)` }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
          <div>
            <h2 style={{ fontFamily:"Georgia,serif", fontSize:isMobile?18:22, color:TEXT, fontWeight:700, margin:0 }}>{co?.company_name || "—"}</h2>
            <div style={{ fontSize:12, color:TEXT2, marginTop:6 }}>
              {co?.abn && <>ABN {co.abn} &nbsp;·&nbsp;</>}
              Ref: <span style={{ color:G, fontFamily:"monospace", fontWeight:700 }}>{co?.client_ref || "—"}</span>
              {co?.books_customer_number && <> &nbsp;·&nbsp; Customer No: <span style={{ color:TEXT2 }}>{co.books_customer_number}</span></>}
            </div>
          </div>
          <Badge text={co?.status === "active" ? "Active" : co?.status || "—"} colour={GREEN} bg={GND} />
        </div>
        {co?.monthly_spend && (
          <div style={{ marginTop:14, fontSize:13, color:TEXT2 }}>
            Total Fees: <span style={{ color:G, fontWeight:700, fontSize:15 }}>{co.monthly_spend}</span>
          </div>
        )}
        <button onClick={() => setPage("personnel")} style={{ background:`linear-gradient(135deg,${G},#b8942e)`, border:"none", borderRadius:8, padding:"10px 20px", color:BG, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", marginTop:16 }}>+ Nominate Personnel</button>
      </div>

      {/* KPI tiles */}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[
          { label:"Total Nominated", value:co?.total_nominees ?? 0, accent:G },
          { label:"Baseline", value:co?.baseline_total ?? 0, accent:TEXT2 },
          { label:"NV1", value:co?.nv1_total ?? 0, accent:BLUE },
          { label:"NV2", value:co?.nv2_total ?? 0, accent:G },
        ].map((s, i) => (
          <div key={i} style={{ background:CARD, borderRadius:12, padding:"16px 14px", border:`1px solid ${BORDER}`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:s.accent }} />
            <div style={{ fontFamily:"Georgia,serif", fontSize:28, fontWeight:700, color:TEXT, lineHeight:1.1 }}>{s.value}</div>
            <div style={{ fontSize:10, color:TEXT2, marginTop:4, textTransform:"uppercase", letterSpacing:"1.5px", fontWeight:600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(3,1fr)", gap:10, marginBottom:16 }}>
        {[
          { label:"New Applications", value:co?.new_total ?? 0, accent:GREEN },
          { label:"Upgrades", value:co?.upgrade_total ?? 0, accent:AMBER },
          { label:"Transfers", value:co?.transfer_total ?? 0, accent:BLUE },
        ].map((s, i) => (
          <div key={i} style={{ background:CARD, borderRadius:12, padding:"14px", border:`1px solid ${BORDER}`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:s.accent }} />
            <div style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:TEXT }}>{s.value}</div>
            <div style={{ fontSize:10, color:TEXT2, marginTop:3, textTransform:"uppercase", letterSpacing:"1px", fontWeight:600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Distribution bar */}
      {(co?.total_nominees ?? 0) > 0 && (
        <div style={{ background:CARD, borderRadius:14, border:`1px solid ${BORDER}`, padding:isMobile?"16px":"22px 24px", marginBottom:16 }}>
          <h3 style={{ fontFamily:"Georgia,serif", fontSize:15, color:TEXT, margin:"0 0 12px", fontWeight:700 }}>Clearance Distribution</h3>
          <div style={{ display:"flex", borderRadius:8, overflow:"hidden", height:28 }}>
            {[
              { pct:((co?.baseline_total ?? 0)/(co?.total_nominees ?? 1))*100, label:"BL", bg:TEXT2 },
              { pct:((co?.nv1_total ?? 0)/(co?.total_nominees ?? 1))*100, label:"NV1", bg:BLUE },
              { pct:((co?.nv2_total ?? 0)/(co?.total_nominees ?? 1))*100, label:"NV2", bg:G },
            ].filter(b => b.pct > 0).map((b, i) => (
              <div key={i} style={{ width:`${b.pct}%`, background:b.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:BG }}>{b.label}</div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div style={{ background:CARD, borderRadius:14, border:`1px solid ${BORDER}`, padding:isMobile?"16px":"22px 24px" }}>
        <h3 style={{ fontFamily:"Georgia,serif", fontSize:15, color:TEXT, margin:"0 0 14px", fontWeight:700 }}>Recent Activity</h3>
        {activity.length === 0 ? <p style={{ color:MUTED, fontSize:13 }}>No activity yet.</p>
          : activity.slice(0,6).map((a, i) => (
          <div key={a.id} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:i<5?`1px solid ${BORDER}`:"none" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:G, marginTop:5, flexShrink:0 }} />
            <div>
              <div style={{ fontSize:13, color:TEXT }}>{a.event}</div>
              <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{fmtDate(a.event_date)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── PERSONNEL ────────────────────────────────────────────────────────────
  const renderPersonnel = () => (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
        <h2 style={{ fontFamily:"Georgia,serif", fontSize:isMobile?18:20, color:TEXT, margin:0, fontWeight:700 }}>
          Nominated Personnel <span style={{ fontSize:14, color:MUTED, fontFamily:"inherit", fontWeight:400 }}>({personnel.length})</span>
        </h2>
        <button style={{ background:`linear-gradient(135deg,${G},#b8942e)`, border:"none", borderRadius:8, padding:"10px 18px", color:BG, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>+ Nominate</button>
      </div>

      {isMobile ? (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {personnel.map(p => (
            <div key={p.id} onClick={() => setSelectedP(p)} style={{ background:CARD, borderRadius:12, border:`1px solid ${BORDER}`, padding:16, cursor:"pointer", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:clrColour(p.clearance_type) }} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:14, color:TEXT, fontWeight:700 }}>{p.employee_name}</div>
                  <div style={{ fontSize:11, color:TEXT2, marginTop:2 }}>{p.stage || "—"}</div>
                </div>
                <Badge text={p.status} colour={stColour(p.status)} bg={stBg(p.status)} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <Badge text={clrLabel(p.clearance_type)} colour={clrColour(p.clearance_type)} bg={clrBg(p.clearance_type)} />
                <span style={{ fontSize:11, color:MUTED }}>{daysAgo(p.batch_date)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background:CARD, borderRadius:14, border:`1px solid ${BORDER}`, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1.5fr 1fr 1fr", padding:"12px 22px", borderBottom:`1px solid ${BORDER}`, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"1.5px", color:MUTED }}>
            <span>Name</span><span>Clearance</span><span>Type</span><span>Stage</span><span>Batch Date</span><span>Status</span>
          </div>
          {personnel.length === 0 && (
            <div style={{ padding:40, textAlign:"center", color:MUTED, fontSize:13 }}>No personnel nominated yet.</div>
          )}
          {personnel.map((p, i) => (
            <div key={p.id} onClick={() => setSelectedP(p)}
              style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1.5fr 1fr 1fr", padding:"14px 22px", borderBottom:i<personnel.length-1?`1px solid ${BORDER}`:"none", alignItems:"center", cursor:"pointer" }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}>
              <div>
                <div style={{ fontSize:13, color:TEXT, fontWeight:600 }}>{p.employee_name}</div>
                {p.email && <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{p.email}</div>}
              </div>
              <span><Badge text={clrLabel(p.clearance_type)} colour={clrColour(p.clearance_type)} bg={clrBg(p.clearance_type)} /></span>
              <span style={{ fontSize:12, color:TEXT2 }}>{p.clearance_request_type || "New"}</span>
              <span style={{ fontSize:12, color:TEXT2 }}>{p.stage || "—"}</span>
              <span style={{ fontSize:12, color:MUTED }}>{fmtDate(p.batch_date)}</span>
              <span><Badge text={p.status} colour={stColour(p.status)} bg={stBg(p.status)} /></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── FINANCIALS ───────────────────────────────────────────────────────────
  const renderFinancials = () => (
    <div>
      <h2 style={{ fontFamily:"Georgia,serif", fontSize:isMobile?18:20, color:TEXT, margin:"0 0 14px", fontWeight:700 }}>Fee Summary</h2>

      {/* Total hero */}
      <div style={{ background:CARD, borderRadius:14, border:`1px solid ${BORDER}`, padding:isMobile?"20px":"28px 32px", marginBottom:16, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${G},transparent)` }} />
        <div style={{ fontSize:11, color:G, textTransform:"uppercase", letterSpacing:"2px", fontWeight:700, marginBottom:8 }}>Total Fees</div>
        <div style={{ fontFamily:"Georgia,serif", fontSize:isMobile?36:48, fontWeight:700, color:TEXT }}>{co?.monthly_spend || "—"}</div>
        <div style={{ fontSize:13, color:TEXT2, marginTop:8 }}>{co?.total_nominees} sponsored employees</div>
      </div>

      {/* Fee breakdown */}
      <div style={{ background:CARD, borderRadius:14, border:`1px solid ${BORDER}`, overflow:"hidden", marginBottom:16 }}>
        <div style={{ padding:"16px 24px", borderBottom:`1px solid ${BORDER}` }}>
          <h3 style={{ fontFamily:"Georgia,serif", fontSize:15, color:TEXT, margin:0, fontWeight:700 }}>Fee Breakdown</h3>
        </div>
        {[
          { label:"Application Fees", value:co?.total_application_fees, sub:`${co?.total_nominees} × $400 application fee` },
          { label:"Sponsorship Fees", value:co?.total_sponsorship_fees, sub:"Year 1 sponsorship" },
          { label:"AGSVA Pass-Through Fees", value:co?.total_agsva_fees, sub:"Government vetting fees (at cost)" },
          { label:"AusClear Fees (excl. AGSVA)", value:co?.total_fees_minus_agsva, sub:"Application + Sponsorship fees only" },
        ].map((row, i, arr) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 24px", borderBottom:i<arr.length-1?`1px solid ${BORDER}`:"none" }}>
            <div>
              <div style={{ fontSize:13, color:TEXT, fontWeight:600 }}>{row.label}</div>
              {row.sub && <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{row.sub}</div>}
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:G, fontFamily:"monospace" }}>{fmt(row.value)}</div>
          </div>
        ))}
      </div>

      {/* Application type breakdown */}
      <div style={{ background:CARD, borderRadius:14, border:`1px solid ${BORDER}`, overflow:"hidden" }}>
        <div style={{ padding:"16px 24px", borderBottom:`1px solid ${BORDER}` }}>
          <h3 style={{ fontFamily:"Georgia,serif", fontSize:15, color:TEXT, margin:0, fontWeight:700 }}>Application Types</h3>
        </div>
        {[
          { label:"New Clearances", value:co?.new_total ?? 0, colour:GREEN },
          { label:"Upgrades", value:co?.upgrade_total ?? 0, colour:AMBER },
          { label:"Transfers", value:co?.transfer_total ?? 0, colour:BLUE },
        ].map((row, i, arr) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 24px", borderBottom:i<arr.length-1?`1px solid ${BORDER}`:"none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:row.colour }} />
              <span style={{ fontSize:13, color:TEXT }}>{row.label}</span>
            </div>
            <span style={{ fontSize:18, fontWeight:700, color:TEXT, fontFamily:"Georgia,serif" }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── ACTIVITY ─────────────────────────────────────────────────────────────
  const renderActivity = () => (
    <div>
      <h2 style={{ fontFamily:"Georgia,serif", fontSize:isMobile?18:20, color:TEXT, margin:"0 0 14px", fontWeight:700 }}>Activity Log</h2>
      <div style={{ background:CARD, borderRadius:14, border:`1px solid ${BORDER}`, overflow:"hidden" }}>
        {activity.length === 0 ? <div style={{ padding:40, textAlign:"center", color:MUTED, fontSize:13 }}>No activity yet.</div>
          : activity.map((a, i) => (
          <div key={a.id} style={{ display:"flex", gap:12, padding:isMobile?"14px 16px":"16px 24px", borderBottom:i<activity.length-1?`1px solid ${BORDER}`:"none" }}>
            <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, background:`${G}20`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:G }} />
            </div>
            <div>
              <div style={{ fontSize:13, color:TEXT }}>{a.event}</div>
              <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{fmtDate(a.event_date)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── SUPPORT ──────────────────────────────────────────────────────────────
  const renderSupport = () => (
    <div>
      <h2 style={{ fontFamily:"Georgia,serif", fontSize:isMobile?18:20, color:TEXT, margin:"0 0 14px", fontWeight:700 }}>Support</h2>
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:14 }}>
        <div style={{ background:CARD, borderRadius:14, border:`1px solid ${BORDER}`, padding:isMobile?"20px 16px":"28px 24px" }}>
          <h3 style={{ fontFamily:"Georgia,serif", fontSize:16, color:TEXT, margin:"0 0 14px", fontWeight:700 }}>Contact AusClear</h3>
          {[
            { label:"Phone", value:"1300 027 423" },
            { label:"Email", value:"support@ausclear.com.au" },
            { label:"Hours", value:"Mon — Fri, 9am — 5pm ACST" },
            { label:"Address", value:"82 Onkaparinga Valley Road, Woodside SA 5244" },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, color:G, textTransform:"uppercase", letterSpacing:"1.5px", fontWeight:700, marginBottom:3 }}>{item.label}</div>
              <div style={{ fontSize:13, color:TEXT }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ background:CARD, borderRadius:14, border:`1px solid ${BORDER}`, padding:isMobile?"20px 16px":"28px 24px" }}>
          <h3 style={{ fontFamily:"Georgia,serif", fontSize:16, color:TEXT, margin:"0 0 14px", fontWeight:700 }}>Knowledge Base</h3>
          <p style={{ fontSize:13, color:TEXT2, lineHeight:1.5, margin:"0 0 20px" }}>Browse 120+ articles on security clearances, AGSVA processes, and DISP requirements.</p>
          <a href="https://support.ausclear.com.au" target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
            <button style={{ background:`linear-gradient(135deg,${G},#b8942e)`, border:"none", borderRadius:8, padding:"12px 22px", color:BG, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Visit Knowledge Base</button>
          </a>
        </div>
      </div>
    </div>
  );

  const pages: Record<string, () => React.ReactElement> = {
    dashboard: renderDashboard, personnel: renderPersonnel,
    financials: renderFinancials, activity: renderActivity, support: renderSupport,
  };

  return (
    <div style={{ minHeight:"100vh", background:BG, color:TEXT, fontSize:14, overflowX:"hidden" }}>
      <Drawer />

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:99 }} />}

      {/* Sidebar */}
      <div style={{ position:"fixed", top:0, left:0, bottom:0, width:240, background:CARD, zIndex:100, borderRight:`1px solid ${BORDER}`, display:"flex", flexDirection:"column", transform:sidebarOpen?"translateX(0)":"translateX(-100%)", transition:"transform 0.3s cubic-bezier(0.4,0,0.2,1)", overflowY:"auto" }}>
        <div style={{ padding:"24px 20px 20px", borderBottom:`1px solid ${BORDER}` }}>
          <img src="https://ausclear.au/AusClear-Light-Transparent.png" alt="AusClear" style={{ height:28 }} />
          <div style={{ fontSize:10, color:G, textTransform:"uppercase", letterSpacing:"2px", fontWeight:700, marginTop:6 }}>Corporate Portal</div>
        </div>
        {data?.user && co && (
          <div style={{ padding:"14px 20px", borderBottom:`1px solid ${BORDER}`, background:"rgba(201,168,76,0.04)" }}>
            <div style={{ fontSize:12, color:G, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{co.company_name}</div>
            <div style={{ fontSize:11, color:MUTED, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:2 }}>{data.user.email}</div>
          </div>
        )}
        <nav style={{ flex:1, padding:"12px 10px" }}>
          {NAV.map(item => {
            const active = page === item.key;
            return (
              <button key={item.key} onClick={() => { setPage(item.key); setSidebarOpen(false); }} style={{ display:"flex", alignItems:"center", width:"100%", padding:"12px 14px", borderRadius:10, border:"none", background:active?GD:"transparent", color:active?G:TEXT2, fontSize:13, fontWeight:active?700:500, cursor:"pointer", fontFamily:"inherit", textAlign:"left", marginBottom:2 }}>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding:"12px 10px 20px", borderTop:`1px solid ${BORDER}` }}>
          <button onClick={handleSignOut} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"12px 14px", borderRadius:10, border:"none", background:"transparent", color:TEXT2, fontSize:13, cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Topbar */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:`${CARD}ee`, backdropFilter:"blur(16px)", borderBottom:`1px solid ${BORDER}`, padding:"0 16px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:TEXT2, fontSize:20, lineHeight:1 }}>☰</button>
          <span style={{ fontFamily:"Georgia,serif", fontSize:15, color:TEXT, fontWeight:700 }}>{NAV.find(n => n.key===page)?.label}</span>
        </div>
        <button onClick={handleSignOut} style={{ width:34, height:34, borderRadius:"50%", background:GD, border:`1px solid ${GB}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:G, fontFamily:"Georgia,serif", cursor:"pointer" }}>{userInitials}</button>
      </div>

      <main style={{ padding:isMobile?"16px 12px 80px":"24px 24px 60px", maxWidth:1100, margin:"0 auto" }}>
        {pages[page]?.()}
      </main>
    </div>
  );
}
