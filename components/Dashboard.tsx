"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── colours ────────────────────────────────────────────────────────────────
const C = {
  bg:     "#07070a",
  card:   "#111318",
  card2:  "#191c24",
  border: "#252b38",
  gold:   "#c9a84c",
  goldD:  "rgba(201,168,76,0.15)",
  goldB:  "rgba(201,168,76,0.35)",
  text:   "#e8e5de",
  muted:  "#7a7a82",
  dim:    "#4a4a52",
  green:  "#5cb87a",
  greenD: "rgba(92,184,122,0.15)",
  greenB: "rgba(92,184,122,0.35)",
  blue:   "#6b9fd4",
  blueD:  "rgba(107,159,212,0.15)",
  blueB:  "rgba(107,159,212,0.35)",
  amber:  "#d4935c",
  amberD: "rgba(212,147,92,0.15)",
  red:    "#c97a7a",
};

// ─── types ───────────────────────────────────────────────────────────────────
type Co = {
  company_name: string; abn: string; client_ref: string; status: string;
  email: string; phone: string; books_customer_number: string;
  total_nominees: number; new_total: number; upgrade_total: number; transfer_total: number;
  baseline_total: number; nv1_total: number; nv2_total: number;
  total_agsva_fees: number; total_application_fees: number;
  total_sponsorship_fees: number; total_fees_minus_agsva: number; overall_progress: number;
};
type P = {
  id: string; employee_name: string; first_name: string; last_name: string;
  email: string; mobile: string; clearance_type: string; clearance_request_type: string;
  stage: string; status: string; batch_date: string | null;
  onboarding_status?: string | null; employee_number?: number | null;
  linked_deal_name?: string | null; revalidation_date?: string | null;
};
type A = { id: string; employee_name: string; event: string; event_type: string; event_date: string };
type Data = { company: Co; personnel: P[]; activity: A[]; user: { email: string; display_name: string } };

// Corporate pipeline stages (account-level, not employee)
const CORP_STAGES = [
  "Onboard Corporate Account",
  "Prepare Contract",
  "Contract Sent",
  "Contracts Signed",
  "Active",
];

// ─── helpers ─────────────────────────────────────────────────────────────────
const $k = (n: number | null | undefined) =>
  n != null ? `$${Number(n).toLocaleString("en-AU")}` : "—";

const $d = (s: string | null) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return s; }
};

const clr = (c: string) =>
  c?.includes("NV2") ? { label: "NV2", col: C.gold,  bg: C.goldD,  border: C.goldB  } :
  c?.includes("NV1") ? { label: "NV1", col: C.blue,  bg: C.blueD,  border: C.blueB  } :
                       { label: "BSL", col: C.muted, bg: "rgba(122,122,130,0.12)", border: "rgba(122,122,130,0.3)" };

const stageCol = (s: string) => {
  const l = (s || "").toLowerCase();
  if (l.includes("denied") || l.includes("closed lost")) return C.red;
  if (l.includes("granted") || l.includes("approved") || l.includes("won") || l.includes("complete") || l.includes("signed")) return C.green;
  return C.amber;
};

// ─── small components ────────────────────────────────────────────────────────
function Pill({ label, col, bg, border }: { label: string; col: string; bg: string; border: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const,
      color: col, background: bg, border: `1px solid ${border}`, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap" as const }}>
      {label}
    </span>
  );
}

function Stat({ label, value, col }: { label: string; value: string | number; col?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, padding: "16px 18px", flex: 1 }}>
      <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.15em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: col || C.text, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

// ─── main ────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab]         = useState<"overview" | "pipeline" | "personnel" | "financials">("overview");
  const [data, setData]       = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [expanded, setExpanded] = useState<string | null>(null); // expanded employee id
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/dashboard/data").then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const co  = data?.company;
  const ppl = data?.personnel || [];
  const act = data?.activity  || [];
  const totalFees = co ? co.total_agsva_fees + co.total_application_fees + co.total_sponsorship_fees : 0;

  // ── overview ──────────────────────────────────────────────────────────────
  const Overview = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Company card */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: `2px solid ${C.gold}`, padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: "0 0 6px" }}>{co?.company_name || "—"}</h1>
            <div style={{ fontSize: 12, color: C.muted }}>
              {co?.abn && <span>ABN {co.abn} &nbsp;·&nbsp; </span>}
              Account: <span style={{ color: C.gold, fontFamily: "monospace", fontWeight: 700 }}>{co?.client_ref || "—"}</span>
            </div>
          </div>
          <Pill label="Active Corporate Client" col={C.green} bg={C.greenD} border={C.greenB} />
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Stat label="Total Nominees" value={co?.total_nominees ?? 0} />
        <Stat label="Total Fees"     value={$k(totalFees)}           col={C.gold} />
        <Stat label="NV1"            value={co?.nv1_total  ?? 0}     col={C.blue} />
        <Stat label="NV2"            value={co?.nv2_total  ?? 0}     col={C.gold} />
        <Stat label="Baseline"       value={co?.baseline_total ?? 0} col={C.muted} />
      </div>

      {/* Corporate pipeline preview */}
      <div style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Corporate Pipeline</span>
          <button onClick={() => setTab("pipeline")} style={{ fontSize: 11, color: C.gold, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            Full view →
          </button>
        </div>
        <div style={{ display: "flex", overflowX: "auto", padding: "14px 18px", gap: 6, alignItems: "center" }}>
          {CORP_STAGES.map((stage, i) => {
            const active = stage === "Onboard Corporate Account"; // where our accounts are
            return (
              <div key={stage} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{ padding: "8px 14px", background: active ? C.goldD : C.card2,
                  border: `1px solid ${active ? C.goldB : C.border}`, borderRadius: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: active ? C.gold : C.dim,
                    textTransform: "uppercase" as const, letterSpacing: "0.08em", whiteSpace: "nowrap" as const }}>
                    {stage}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: active ? C.gold : C.dim, marginTop: 2, textAlign: "center" as const }}>
                    {active ? 3 : 0}
                  </div>
                </div>
                {i < CORP_STAGES.length - 1 && <span style={{ color: C.dim, fontSize: 16 }}>›</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      {act.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Recent Activity</span>
          </div>
          {act.slice(0, 6).map((a, i) => (
            <div key={a.id} style={{ display: "flex", gap: 12, padding: "11px 18px",
              borderBottom: i < Math.min(act.length, 6) - 1 ? `1px solid ${C.border}` : "none", alignItems: "flex-start" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1, fontSize: 12, color: C.text }}>{a.event}</div>
              <div style={{ fontSize: 11, color: C.dim, whiteSpace: "nowrap" as const }}>{$d(a.event_date)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── pipeline ──────────────────────────────────────────────────────────────
  // Real corporate account-level deals from Zoho
  const corpDeals = [
    { id: "1", name: "Clearance FIRST",  stage: "Onboard Corporate Account", amount: 2886,  created: "2026-04-03" },
    { id: "2", name: "Adept CONTRACTS",  stage: "Prepare Contract",           amount: 3215,  created: "2026-04-04" },
    { id: "3", name: "NETFLIX",          stage: "Onboard Corporate Account", amount: 5488,  created: "2026-04-18" },
  ];

  const Pipeline = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: C.gold, textTransform: "uppercase" as const, letterSpacing: "0.2em", marginBottom: 4 }}>
          Corporate Accounts
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Pipeline — {corpDeals.length} accounts</h2>
      </div>

      {/* Horizontal pipeline board */}
      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ display: "flex", gap: 1, minWidth: CORP_STAGES.length * 190 }}>
          {CORP_STAGES.map((stage, si) => {
            const cards = corpDeals.filter(d => d.stage === stage);
            const isFirst = si === 0;
            const isLast  = si === CORP_STAGES.length - 1;
            return (
              <div key={stage} style={{ flex: 1, minWidth: 170 }}>
                {/* Column header */}
                <div style={{ padding: "10px 12px", borderBottom: `2px solid ${isLast ? C.green : isFirst ? C.gold : C.border}`,
                  background: C.card2, marginBottom: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const,
                    color: isLast ? C.green : isFirst ? C.gold : C.muted }}>
                    {stage}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginTop: 3 }}>{cards.length}</div>
                </div>
                {/* Cards */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: "none", minHeight: 100, padding: 4 }}>
                  {cards.map(d => (
                    <div key={d.id} style={{ background: C.card2, border: `1px solid ${C.border}`,
                      borderRadius: 4, padding: "10px 12px", marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, marginBottom: 4 }}>{$k(d.amount)}</div>
                      <div style={{ fontSize: 10, color: C.dim }}>{$d(d.created)}</div>
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <div style={{ padding: "20px 8px", textAlign: "center" as const, fontSize: 11, color: C.dim }}>—</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline totals */}
      <div style={{ display: "flex", gap: 1 }}>
        <Stat label="Total Accounts" value={corpDeals.length} />
        <Stat label="Total Pipeline Value" value={$k(corpDeals.reduce((s,d) => s + d.amount, 0))} col={C.gold} />
        <Stat label="Active" value={corpDeals.filter(d => d.stage === "Active").length} col={C.green} />
      </div>
    </div>
  );

  // ── personnel ─────────────────────────────────────────────────────────────
  const Personnel = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>
          Personnel &nbsp;<span style={{ fontSize: 14, color: C.muted, fontWeight: 400 }}>({ppl.length})</span>
        </h2>
        <button style={{ background: C.gold, border: "none", padding: "9px 18px", color: C.bg,
          fontWeight: 700, fontSize: 12, cursor: "pointer", borderRadius: 4 }}>
          + Nominate Employee
        </button>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}` }}>
        {ppl.length === 0 && (
          <div style={{ padding: 40, textAlign: "center" as const, color: C.dim }}>No personnel nominated yet.</div>
        )}
        {ppl.map((p, i) => {
          const open = expanded === p.id;
          const t = clr(p.clearance_type);
          const sc = stageCol(p.stage);
          return (
            <div key={p.id} style={{ borderBottom: i < ppl.length - 1 ? `1px solid ${C.border}` : "none" }}>
              {/* Row — click to expand */}
              <div
                onClick={() => setExpanded(open ? null : p.id)}
                style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 18px", cursor: "pointer",
                  background: open ? C.card2 : "transparent", transition: "background 0.15s" }}
                onMouseEnter={e => { if (!open) (e.currentTarget as HTMLDivElement).style.background = C.card2; }}
                onMouseLeave={e => { if (!open) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                {/* Status dot */}
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: sc }} />
                {/* Name + stage */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.employee_name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{p.stage || "—"}</div>
                </div>
                {/* Tags */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                  <Pill label={t.label} col={t.col} bg={t.bg} border={t.border} />
                  {p.clearance_request_type && (
                    <Pill label={p.clearance_request_type} col={C.muted} bg="rgba(122,122,130,0.1)" border="rgba(122,122,130,0.25)" />
                  )}
                  <span style={{ color: C.dim, fontSize: 16, transform: open ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s" }}>›</span>
                </div>
              </div>

              {/* Expanded detail — inline, no drawer */}
              {open && (
                <div style={{ padding: "0 18px 20px 40px", background: C.card2, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px 32px", paddingTop: 16 }}>
                    {[
                      { label: "Full Name",       value: p.employee_name },
                      { label: "Email",           value: p.email || "—" },
                      { label: "Mobile",          value: p.mobile || "—" },
                      { label: "Clearance Level", value: p.clearance_type || "—" },
                      { label: "Request Type",    value: p.clearance_request_type || "New" },
                      { label: "Current Stage",   value: p.stage || "—" },
                      { label: "Onboarding",      value: p.onboarding_status || "—" },
                      { label: "Batch Date",      value: $d(p.batch_date) },
                      { label: "Revalidation",    value: $d(p.revalidation_date || null) },
                      { label: "Linked Deal",     value: p.linked_deal_name || "—" },
                    ].map((row, ri) => (
                      <div key={ri}>
                        <div style={{ fontSize: 10, color: C.gold, textTransform: "uppercase" as const,
                          letterSpacing: "0.12em", fontWeight: 700, marginBottom: 3 }}>{row.label}</div>
                        <div style={{ fontSize: 13, color: row.value === "—" ? C.dim : C.text }}>{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── financials ────────────────────────────────────────────────────────────
  const Financials = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: C.gold, textTransform: "uppercase" as const, letterSpacing: "0.2em", marginBottom: 4 }}>Fee Summary</div>
        <div style={{ fontSize: 38, fontWeight: 700, color: C.text }}>{$k(totalFees)}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Total across {co?.total_nominees || 0} sponsored employees</div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}` }}>
        {[
          { label: "Application Fees",           value: co?.total_application_fees,    note: `${co?.total_nominees || 0} × $400` },
          { label: "Year 1 Sponsorship Fees",    value: co?.total_sponsorship_fees,    note: "$1,460 per employee" },
          { label: "AGSVA Pass-Through Fees",    value: co?.total_agsva_fees,          note: "Government vetting at cost" },
          { label: "AusClear Fees (ex-AGSVA)",   value: co?.total_fees_minus_agsva,    note: "Application + Sponsorship only" },
        ].map((row, i, arr) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 18px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div>
              <div style={{ fontSize: 13, color: C.text }}>{row.label}</div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{row.note}</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.gold, fontFamily: "monospace" }}>{$k(row.value)}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 1 }}>
        <Stat label="New Clearances" value={co?.new_total      ?? 0} col={C.green} />
        <Stat label="Upgrades"       value={co?.upgrade_total  ?? 0} col={C.amber} />
        <Stat label="Transfers"      value={co?.transfer_total ?? 0} col={C.blue}  />
      </div>
    </div>
  );

  // ── loading / error ───────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" as const }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${C.border}`, borderTopColor: C.gold,
          borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: C.muted, fontSize: 11, letterSpacing: "0.2em" }}>LOADING...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, padding: 32, textAlign: "center" as const, borderRadius: 8 }}>
        <p style={{ color: C.red, marginBottom: 16 }}>{error}</p>
        <button onClick={() => router.push("/login")} style={{ background: C.gold, border: "none", padding: "10px 22px",
          color: C.bg, fontWeight: 700, cursor: "pointer", borderRadius: 4 }}>Back to Login</button>
      </div>
    </div>
  );

  // ── shell ─────────────────────────────────────────────────────────────────
  const TABS = [
    { key: "overview",   label: "Overview"   },
    { key: "pipeline",   label: "Pipeline"   },
    { key: "personnel",  label: "Personnel"  },
    { key: "financials", label: "Financials" },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: `${C.card}f5`, backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`, padding: "0 20px", height: 54,
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="https://ausclear.au/AusClear-Light-Transparent.png" alt="AusClear" style={{ height: 22 }} />
          <div style={{ width: 1, height: 18, background: C.border }} />
          <span style={{ fontSize: 12, color: C.muted }}>{co?.company_name || "Corporate Portal"}</span>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: `1px solid ${C.border}`,
            padding: "6px 12px", color: C.muted, cursor: "pointer", fontSize: 13 }}>☰ Menu</button>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />
              <div style={{ position: "absolute", right: 0, top: 36, background: C.card, border: `1px solid ${C.border}`,
                zIndex: 50, minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                {TABS.map(t => (
                  <button key={t.key} onClick={() => { setTab(t.key); setMenuOpen(false); }}
                    style={{ display: "block", width: "100%", padding: "11px 18px", border: "none",
                      borderBottom: `1px solid ${C.border}`, background: tab === t.key ? C.goldD : "transparent",
                      color: tab === t.key ? C.gold : C.text, fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
                    {t.label}
                  </button>
                ))}
                <button onClick={() => router.push("/logout")} style={{ display: "block", width: "100%", padding: "11px 18px",
                  border: "none", background: "transparent", color: C.muted, fontSize: 12, cursor: "pointer", textAlign: "left" as const }}>
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "0 20px", display: "flex", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "13px 18px", border: "none",
            borderBottom: tab === t.key ? `2px solid ${C.gold}` : "2px solid transparent",
            background: "transparent", color: tab === t.key ? C.gold : C.muted,
            fontSize: 13, fontWeight: tab === t.key ? 600 : 400, cursor: "pointer",
            whiteSpace: "nowrap" as const, letterSpacing: "0.03em" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "22px 20px 60px" }}>
        {tab === "overview"   && <Overview />}
        {tab === "pipeline"   && <Pipeline />}
        {tab === "personnel"  && <Personnel />}
        {tab === "financials" && <Financials />}
      </main>
    </div>
  );
}
