"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ── Exact colours from the HTML report ──────────────────────────────────────
const BG    = "#07070a";
const PANEL = "#0f1117";
const P2    = "#161922";
const LINE  = "#1f2330";
const GOLD  = "#c9a84c";
const GOLDS = "rgba(201,168,76,0.12)";
const INK   = "#e9e6df";
const MUTE  = "#8a8a8f";
const DIM   = "#5a5a60";
const GREEN = "#7fb98b";
const RED   = "#c97a7a";
const BLUE  = "#7a9bc9";

const CG = "'Cormorant Garamond', Georgia, serif";
const JB = "'JetBrains Mono', 'Courier New', monospace";

function stageCol(s: string) {
  const l = (s||"").toLowerCase();
  if (l.includes("denied") || l.includes("closed lost")) return RED;
  if (l.includes("signed") || l.includes("approved") || l.includes("granted") || l.includes("complete") || l.includes("won")) return GREEN;
  return GOLD;
}
function clrCol(c: string) { return c?.includes("NV2") ? GOLD : BLUE; }
function clrLbl(c: string) { return c?.includes("NV2") ? "NV2" : c?.includes("NV1") ? "NV1" : "BSL"; }

function fmtMoney(n: number|null|undefined) {
  if (n == null) return "—";
  return "$" + Number(n).toLocaleString("en-AU", { minimumFractionDigits: 0 });
}
function fmtDate(d: string|null) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    const day = String(dt.getDate()).padStart(2, "0");
    const mon = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][dt.getMonth()];
    return `${day} ${mon} ${dt.getFullYear()}`;
  } catch { return d; }
}

// ── Tag — exact .tag style from HTML report ──────────────────────────────────
function Tag({ text, col }: { text: string; col: string }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      border: `1px solid ${col}`,
      color: col,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      fontSize: 9,
      fontFamily: JB,
      fontWeight: 400,
      whiteSpace: "nowrap",
      lineHeight: "1.6",
    }}>{text}</span>
  );
}

const NAV = ["Dashboard", "Personnel", "Financials", "Activity", "Support"];

type Co = {
  company_name: string; abn: string; client_ref: string;
  email: string; phone: string; books_customer_number: string;
  total_nominees: number; new_total: number; upgrade_total: number; transfer_total: number;
  baseline_total: number; nv1_total: number; nv2_total: number;
  total_agsva_fees: number; total_application_fees: number;
  total_sponsorship_fees: number; total_fees_minus_agsva: number; overall_progress: number;
};
type P = {
  id: string; employee_name: string; first_name: string; last_name: string;
  email: string; mobile: string; clearance_type: string; clearance_request_type: string;
  stage: string; status: string; batch_date: string|null; onboarding_status: string|null;
  employee_number: number|null; linked_deal_name: string|null; revalidation_date: string|null;
};
type A = { id: string; employee_name: string; event: string; event_type: string; event_date: string; };
type Data = { company: Co; personnel: P[]; activity: A[]; user: { email: string; display_name: string; role: string }; };

// ── Deal card — exact .deal-card from HTML report ────────────────────────────
function DealCard({ p, company, onClick }: { p: P; company: string; onClick: () => void }) {
  const typTag = p.clearance_request_type === "Upgrade" ? "UPGRADE"
               : p.clearance_request_type === "Transfer" ? "TRANSFER" : "EMPLOYEE";
  const fee = p.clearance_request_type === "Upgrade" ? 350
            : p.clearance_request_type === "Transfer" ? 250 : 1860;
  const sc = stageCol(p.stage);

  return (
    <div
      onClick={onClick}
      style={{ background: PANEL, padding: "14px 16px", display: "grid", gap: 6, cursor: "pointer", borderBottom: `1px solid ${LINE}` }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = P2}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = PANEL}
    >
      {/* Row 1: Name · Company  |  $Amount */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontFamily: CG, fontSize: 16, color: INK, fontWeight: 400, lineHeight: 1.3 }}>
          {p.employee_name}
          {company && <span style={{ color: MUTE }}> · {company}</span>}
        </div>
        <div style={{ fontFamily: JB, fontSize: 13, color: GOLD, fontWeight: 500, whiteSpace: "nowrap" }}>
          {fmtMoney(fee)}
        </div>
      </div>

      {/* Row 2: tags */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Tag text={typTag} col={GOLD} />
        <Tag text={clrLbl(p.clearance_type)} col={clrCol(p.clearance_type)} />
        <Tag text={(p.stage || "Pending").toUpperCase()} col={sc} />
      </div>

      {/* Row 3: meta — date · email prefix */}
      <div style={{ fontFamily: JB, fontSize: 9, color: DIM, letterSpacing: "0.05em" }}>
        {p.batch_date ? fmtDate(p.batch_date) : "—"}
        {p.email && <span> · {p.email.split("@")[0].toUpperCase()}</span>}
      </div>
    </div>
  );
}

// ── Drawer ───────────────────────────────────────────────────────────────────
function Drawer({ p, onClose }: { p: P; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 340, background: PANEL, zIndex: 201, borderLeft: `1px solid ${LINE}`, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ height: 2, background: `linear-gradient(90deg,${GOLD},transparent)` }} />
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${LINE}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: CG, fontSize: 18, color: INK, fontWeight: 500, marginBottom: 8 }}>{p.employee_name}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Tag text={clrLbl(p.clearance_type)} col={clrCol(p.clearance_type)} />
              <Tag text={(p.stage || "Pending").toUpperCase()} col={stageCol(p.stage)} />
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${LINE}`, cursor: "pointer", color: MUTE, fontSize: 14, padding: "4px 10px", fontFamily: JB }}>✕</button>
        </div>
        <div style={{ padding: 24, flex: 1 }}>
          {[
            { label: "EMAIL",           value: p.email || "—" },
            { label: "MOBILE",          value: p.mobile || "—" },
            { label: "CLEARANCE",       value: p.clearance_type || "—" },
            { label: "REQUEST TYPE",    value: p.clearance_request_type || "New" },
            { label: "STAGE",           value: p.stage || "—" },
            { label: "ONBOARDING",      value: p.onboarding_status || "—" },
            { label: "BATCH DATE",      value: fmtDate(p.batch_date) },
            { label: "REVALIDATION",    value: fmtDate(p.revalidation_date) },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < 7 ? `1px solid ${LINE}` : "none" }}>
              <div style={{ fontFamily: JB, fontSize: 9, color: GOLD, letterSpacing: "0.18em", marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: item.value === "—" ? DIM : INK }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 24px 22px", borderTop: `1px solid ${LINE}` }}>
          <div style={{ fontFamily: JB, fontSize: 9, color: DIM, letterSpacing: "0.1em" }}>SUPPORT · 1300 027 423 · support@ausclear.com.au</div>
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const [page, setPage] = useState("Personnel");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedP, setSelectedP] = useState<P|null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [data, setData] = useState<Data|null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

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

  const co = data?.company;
  const personnel = data?.personnel || [];
  const activity = data?.activity || [];
  const totalFees = co ? (co.total_agsva_fees + co.total_application_fees + co.total_sponsorship_fees) : 0;

  // ── PERSONNEL ─────────────────────────────────────────────────────────────
  const renderPersonnel = () => (
    <div>
      <div style={{ marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${LINE}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <h2 style={{ fontFamily: CG, fontSize: isMobile ? 22 : 28, fontWeight: 400, color: INK, margin: 0, lineHeight: 1.1 }}>
          <span style={{ fontFamily: JB, fontSize: 10, color: GOLD, letterSpacing: "0.2em", marginRight: 10 }}>V</span>
          Active Personnel Register
        </h2>
        <span style={{ fontFamily: JB, fontSize: 9, color: MUTE, letterSpacing: "0.1em" }}>{personnel.length} PERSONNEL</span>
      </div>
      <div style={{ border: `1px solid ${LINE}`, background: LINE }}>
        {personnel.length === 0
          ? <div style={{ background: PANEL, padding: "40px 20px", textAlign: "center", color: MUTE, fontFamily: JB, fontSize: 11 }}>NO PERSONNEL NOMINATED</div>
          : personnel.map(p => <DealCard key={p.id} p={p} company={co?.company_name || ""} onClick={() => setSelectedP(p)} />)
        }
      </div>
      <div style={{ marginTop: 14, textAlign: "right" }}>
        <button style={{ fontFamily: JB, fontSize: 9, letterSpacing: "0.15em", color: GOLD, background: GOLDS, border: `1px solid ${GOLD}`, padding: "8px 18px", cursor: "pointer" }}>
          + NOMINATE EMPLOYEE
        </button>
      </div>
    </div>
  );

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: JB, fontSize: 9, letterSpacing: "0.35em", color: GOLD, textTransform: "uppercase", marginBottom: 8 }}>Corporate Intelligence · CRM Snapshot</div>
        <h1 style={{ fontFamily: CG, fontSize: isMobile ? 38 : 56, fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 8px", color: INK }}>
          {co?.company_name || "Dashboard"}
        </h1>
        <div style={{ fontSize: 12, color: MUTE, lineHeight: 1.5 }}>
          {co?.abn && <span>ABN {co.abn} · </span>}
          Ref: <span style={{ color: GOLD, fontFamily: JB }}>{co?.client_ref || "—"}</span>
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(5,1fr)", gap: 1, background: LINE, border: `1px solid ${LINE}`, marginBottom: 28 }}>
        {[
          { label: "Total Nominees", value: String(co?.total_nominees ?? 0), meta: "sponsored", gold: true },
          { label: "Baseline",       value: String(co?.baseline_total ?? 0), meta: "entry tier",    gold: false },
          { label: "NV1",            value: String(co?.nv1_total ?? 0),      meta: "dominant",      gold: true },
          { label: "NV2",            value: String(co?.nv2_total ?? 0),      meta: "premium tier",  gold: false },
          { label: "AusClear Fees",  value: fmtMoney(co?.total_fees_minus_agsva), meta: "ex AGSVA",gold: false },
        ].map((s, i) => (
          <div key={i} style={{ background: PANEL, padding: isMobile ? "16px 14px" : "22px 20px" }}>
            <div style={{ fontFamily: JB, fontSize: 9, color: MUTE, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontFamily: CG, fontSize: isMobile ? 28 : 36, fontWeight: 400, lineHeight: 1, marginBottom: 6, color: s.gold ? GOLD : INK }}>{s.value}</div>
            <div style={{ fontSize: 10, color: MUTE, fontFamily: JB }}>{s.meta}</div>
          </div>
        ))}
      </div>

      {/* Personnel preview */}
      <div style={{ marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${LINE}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <h2 style={{ fontFamily: CG, fontSize: isMobile ? 20 : 26, fontWeight: 400, color: INK, margin: 0 }}>
          <span style={{ fontFamily: JB, fontSize: 10, color: GOLD, letterSpacing: "0.2em", marginRight: 10 }}>V</span>
          Personnel Register
        </h2>
        <button onClick={() => setPage("Personnel")} style={{ fontFamily: JB, fontSize: 9, letterSpacing: "0.12em", color: GOLD, background: "transparent", border: `1px solid ${LINE}`, padding: "5px 12px", cursor: "pointer" }}>
          VIEW ALL →
        </button>
      </div>
      <div style={{ border: `1px solid ${LINE}`, background: LINE, marginBottom: 28 }}>
        {personnel.slice(0, 5).map(p => <DealCard key={p.id} p={p} company={co?.company_name || ""} onClick={() => setSelectedP(p)} />)}
      </div>

      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderLeft: `2px solid ${GOLD}`, padding: "12px 16px", fontSize: 12, color: MUTE, lineHeight: 1.6 }}>
        <strong style={{ color: GOLD, fontFamily: JB, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>FEE MODEL</strong>
        Application $400 + Year 1 Sponsorship $1,460 per employee. AGSVA vetting fees are government pass-through — excluded from AusClear fees.
      </div>
    </div>
  );

  // ── FINANCIALS ────────────────────────────────────────────────────────────
  const renderFinancials = () => (
    <div>
      <div style={{ marginBottom: 20, paddingBottom: 8, borderBottom: `1px solid ${LINE}` }}>
        <h2 style={{ fontFamily: CG, fontSize: 28, fontWeight: 400, color: INK, margin: 0 }}>
          <span style={{ fontFamily: JB, fontSize: 10, color: GOLD, letterSpacing: "0.2em", marginRight: 10 }}>II</span>
          Pipeline Value
        </h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 1, background: LINE, border: `1px solid ${LINE}`, marginBottom: 20 }}>
        {[
          { label: "Total Fees",         value: fmtMoney(totalFees),                     gold: true },
          { label: "Application Fees",   value: fmtMoney(co?.total_application_fees),    gold: false },
          { label: "Sponsorship Fees",   value: fmtMoney(co?.total_sponsorship_fees),    gold: false },
          { label: "AGSVA Fees",         value: fmtMoney(co?.total_agsva_fees),          gold: false },
        ].map((s, i) => (
          <div key={i} style={{ background: PANEL, padding: "18px 16px" }}>
            <div style={{ fontFamily: JB, fontSize: 9, color: MUTE, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: CG, fontSize: isMobile ? 24 : 32, fontWeight: 400, lineHeight: 1, color: s.gold ? GOLD : INK }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: PANEL, border: `1px solid ${LINE}`, marginBottom: 16 }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${LINE}` }}>
          <div style={{ fontFamily: CG, fontSize: 18, color: INK, fontWeight: 500 }}>Fee Breakdown</div>
          <div style={{ fontFamily: JB, fontSize: 9, color: MUTE, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 4 }}>Application + Sponsorship · ex AGSVA pass-through</div>
        </div>
        {[
          { label: "Application Fees",          value: fmtMoney(co?.total_application_fees),    sub: `${co?.total_nominees || 0} × $400` },
          { label: "Sponsorship Fees",          value: fmtMoney(co?.total_sponsorship_fees),    sub: "Year 1 at $1,460/employee" },
          { label: "AGSVA Pass-Through",        value: fmtMoney(co?.total_agsva_fees),          sub: "Government fees at cost" },
          { label: "AusClear Fees (ex-AGSVA)",  value: fmtMoney(co?.total_fees_minus_agsva),   sub: "Application + Sponsorship only" },
        ].map((row, i, arr) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: i < arr.length - 1 ? `1px solid ${LINE}` : "none" }}>
            <div>
              <div style={{ fontSize: 13, color: INK }}>{row.label}</div>
              <div style={{ fontFamily: JB, fontSize: 9, color: DIM, marginTop: 3, letterSpacing: "0.05em" }}>{row.sub}</div>
            </div>
            <div style={{ fontFamily: JB, fontSize: 14, color: GOLD, fontWeight: 500 }}>{row.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: PANEL, border: `1px solid ${LINE}` }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${LINE}` }}>
          <div style={{ fontFamily: CG, fontSize: 18, color: INK, fontWeight: 500 }}>Application Types</div>
        </div>
        {[
          { label: "New Clearances", value: co?.new_total ?? 0,      col: GREEN },
          { label: "Upgrades",       value: co?.upgrade_total ?? 0,  col: GOLD },
          { label: "Transfers",      value: co?.transfer_total ?? 0, col: BLUE },
        ].map((row, i, arr) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: i < arr.length - 1 ? `1px solid ${LINE}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: row.col }} />
              <span style={{ fontSize: 13, color: INK }}>{row.label}</span>
            </div>
            <span style={{ fontFamily: JB, fontSize: 13, color: row.col }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── ACTIVITY ──────────────────────────────────────────────────────────────
  const renderActivity = () => (
    <div>
      <div style={{ marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${LINE}` }}>
        <h2 style={{ fontFamily: CG, fontSize: 28, fontWeight: 400, color: INK, margin: 0 }}>
          <span style={{ fontFamily: JB, fontSize: 10, color: GOLD, letterSpacing: "0.2em", marginRight: 10 }}>IV</span>
          Activity Log
        </h2>
      </div>
      <div style={{ border: `1px solid ${LINE}`, background: LINE }}>
        {activity.length === 0
          ? <div style={{ background: PANEL, padding: "32px 18px", textAlign: "center", color: MUTE, fontFamily: JB, fontSize: 10 }}>NO ACTIVITY</div>
          : activity.map((a, i) => (
          <div key={a.id} style={{ background: PANEL, padding: "12px 16px", borderBottom: i < activity.length - 1 ? `1px solid ${LINE}` : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ fontSize: 13, color: INK, lineHeight: 1.4 }}>{a.event}</div>
              <div style={{ fontFamily: JB, fontSize: 9, color: DIM, whiteSpace: "nowrap", marginTop: 2 }}>{fmtDate(a.event_date)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── SUPPORT ───────────────────────────────────────────────────────────────
  const renderSupport = () => (
    <div>
      <div style={{ marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${LINE}` }}>
        <h2 style={{ fontFamily: CG, fontSize: 28, fontWeight: 400, color: INK, margin: 0 }}>Support</h2>
      </div>
      <div style={{ background: PANEL, border: `1px solid ${LINE}`, marginBottom: 16 }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${LINE}` }}>
          <div style={{ fontFamily: CG, fontSize: 18, color: INK, fontWeight: 500 }}>Contact AusClear</div>
        </div>
        {[
          { label: "PHONE",   value: "1300 027 423" },
          { label: "EMAIL",   value: "support@ausclear.com.au" },
          { label: "HOURS",   value: "Mon–Fri, 9am–5pm ACST" },
          { label: "ADDRESS", value: "82 Onkaparinga Valley Road, Woodside SA 5244" },
        ].map((item, i, arr) => (
          <div key={i} style={{ padding: "14px 18px", borderBottom: i < arr.length - 1 ? `1px solid ${LINE}` : "none" }}>
            <div style={{ fontFamily: JB, fontSize: 9, color: GOLD, letterSpacing: "0.15em", marginBottom: 3 }}>{item.label}</div>
            <div style={{ fontSize: 13, color: MUTE }}>{item.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderLeft: `2px solid ${GOLD}`, padding: "12px 16px", fontSize: 11, color: DIM, fontFamily: JB, letterSpacing: "0.05em", lineHeight: 1.6 }}>
        NEPHTHYS PTY LTD T/AS AUSCLEAR · ABN 70 628 031 587 · DISP-ACCREDITED SPONSOR
      </div>
    </div>
  );

  const pages: Record<string, () => React.ReactElement> = {
    Dashboard: renderDashboard, Personnel: renderPersonnel,
    Financials: renderFinancials, Activity: renderActivity, Support: renderSupport,
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${LINE}`, borderTopColor: GOLD, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
        <p style={{ color: MUTE, fontSize: 10, fontFamily: JB, letterSpacing: "0.2em" }}>LOADING...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: PANEL, border: `1px solid ${LINE}`, padding: 32, maxWidth: 340, textAlign: "center" }}>
        <p style={{ color: RED, fontSize: 12, marginBottom: 16, fontFamily: JB }}>{error}</p>
        <button onClick={() => router.push("/login")} style={{ fontFamily: JB, fontSize: 10, letterSpacing: "0.15em", color: GOLD, background: GOLDS, border: `1px solid ${GOLD}`, padding: "8px 18px", cursor: "pointer" }}>BACK TO LOGIN</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, color: INK, fontSize: 14, overflowX: "hidden" }}>
      {selectedP && <Drawer p={selectedP} onClose={() => setSelectedP(null)} />}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 99 }} />}

      {/* Sidebar */}
      <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 210, background: PANEL, zIndex: 100, borderRight: `1px solid ${LINE}`, display: "flex", flexDirection: "column", transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.3s ease" }}>
        <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${LINE}` }}>
          <img src="https://ausclear.au/AusClear-Light-Transparent.png" alt="AusClear" style={{ height: 24 }} />
          <div style={{ fontFamily: JB, fontSize: 8, color: GOLD, letterSpacing: "0.25em", marginTop: 6 }}>CORPORATE PORTAL</div>
        </div>
        {co && (
          <div style={{ padding: "10px 18px", borderBottom: `1px solid ${LINE}`, background: "rgba(201,168,76,0.04)" }}>
            <div style={{ fontFamily: JB, fontSize: 9, color: GOLD, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "0.08em" }}>{co.company_name.toUpperCase()}</div>
            <div style={{ fontSize: 10, color: DIM, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data?.user?.email}</div>
          </div>
        )}
        <nav style={{ flex: 1, padding: "10px 0" }}>
          {NAV.map(item => {
            const active = page === item;
            return (
              <button key={item} onClick={() => { setPage(item); setSidebarOpen(false); }}
                style={{ display: "block", width: "100%", padding: "11px 18px", border: "none", background: active ? "rgba(201,168,76,0.06)" : "transparent", color: active ? GOLD : MUTE, fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left", borderLeft: active ? `2px solid ${GOLD}` : `2px solid transparent` }}>
                {item}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "10px 0", borderTop: `1px solid ${LINE}` }}>
          <button onClick={() => router.push("/logout")} style={{ display: "block", width: "100%", padding: "10px 18px", border: "none", background: "transparent", color: DIM, fontSize: 10, cursor: "pointer", fontFamily: JB, textAlign: "left", letterSpacing: "0.1em" }}>SIGN OUT</button>
        </div>
      </div>

      {/* Topbar */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: `${PANEL}f0`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${LINE}`, padding: "0 16px", height: 50, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: MUTE, fontSize: 18, lineHeight: 1 }}>☰</button>
          <span style={{ fontFamily: JB, fontSize: 10, color: MUTE, letterSpacing: "0.15em" }}>{page.toUpperCase()}</span>
        </div>
        <span style={{ fontFamily: JB, fontSize: 9, color: GOLD, letterSpacing: "0.12em" }}>{co?.company_name?.toUpperCase() || ""}</span>
      </div>

      {/* Body */}
      <div style={{ background: `radial-gradient(circle at 15% 0%, rgba(201,168,76,0.06) 0%, transparent 40%), ${BG}`, minHeight: "calc(100vh - 50px)" }}>
        <main style={{ padding: isMobile ? "18px 14px 80px" : "28px 20px 60px", maxWidth: 860, margin: "0 auto" }}>
          {pages[page]?.()}
        </main>
      </div>
    </div>
  );
}
