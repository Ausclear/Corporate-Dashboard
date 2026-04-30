"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Corporate pipeline stages in order
const CORP_STAGES = [
  "Onboard Corporate Account",
  "Prepare Contract",
  "Contract Sent",
  "Contracts Signed",
  "Active",
];

const GOLD = "#c9a84c";
const BG = "#07070a";
const CARD = "#0f1117";
const CARD2 = "#161922";
const BORDER = "#1f2330";
const TEXT = "#e9e6df";
const MUTED = "#8a8a8f";
const DIM = "#5a5a60";
const GREEN = "#7fb98b";
const RED = "#c97a7a";
const BLUE = "#7a9bc9";

const fmtMoney = (n: number | null | undefined) =>
  n != null ? `$${Number(n).toLocaleString("en-AU")}` : "—";
const fmtDate = (d: string | null) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
};
const clrTag = (c: string) => c?.includes("NV2") ? { col: GOLD, bg: "rgba(201,168,76,0.12)", label: "NV2" } :
  c?.includes("NV1") ? { col: BLUE, bg: "rgba(122,155,201,0.12)", label: "NV1" } :
  { col: MUTED, bg: "rgba(138,138,143,0.12)", label: "BSL" };

type CorpDeal = { id: string; deal_name: string; stage: string; account_name: string; amount: number; created_time: string; };
type Personnel = { id: string; employee_name: string; clearance_type: string; clearance_request_type: string; stage: string; status: string; batch_date: string | null; email: string; onboarding_status?: string | null; };
type Co = { company_name: string; abn: string; client_ref: string; total_nominees: number; baseline_total: number; nv1_total: number; nv2_total: number; total_agsva_fees: number; total_application_fees: number; total_sponsorship_fees: number; total_fees_minus_agsva: number; email: string; phone: string; };
type Data = { company: Co; personnel: Personnel[]; activity: any[]; user: { email: string; display_name: string; }; corp_deals?: CorpDeal[]; };

const NAV = ["Overview", "Pipeline", "Personnel", "Financials", "Support"];

function Tag({ label, col, bg }: { label: string; col: string; bg: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: col, background: bg, border: `1px solid ${col}30`, padding: "2px 8px", borderRadius: 3, whiteSpace: "nowrap" as const }}>
      {label}
    </span>
  );
}

export default function Dashboard() {
  const [page, setPage] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedP, setSelectedP] = useState<Personnel | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/dashboard/data").then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const co = data?.company;
  const personnel = data?.personnel || [];
  const activity = data?.activity || [];
  const totalFees = co ? (co.total_agsva_fees + co.total_application_fees + co.total_sponsorship_fees) : 0;

  // Build corp pipeline data from API data + supplement with known deals
  const corpDeals: CorpDeal[] = data?.corp_deals || [
    { id: "1", deal_name: co?.company_name || "Corporate Account", stage: "Onboard Corporate Account", account_name: co?.company_name || "", amount: totalFees, created_time: new Date().toISOString() }
  ];

  // ── HORIZONTAL PIPELINE ───────────────────────────────────────────────────
  const renderPipeline = () => {
    const stageGroups: Record<string, CorpDeal[]> = {};
    CORP_STAGES.forEach(s => { stageGroups[s] = []; });
    corpDeals.forEach(d => {
      if (stageGroups[d.stage]) stageGroups[d.stage].push(d);
      else stageGroups["Onboard Corporate Account"].push(d);
    });

    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: GOLD, textTransform: "uppercase" as const, letterSpacing: "0.2em", marginBottom: 6 }}>Corporate Pipeline</div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 400, color: TEXT, margin: 0 }}>Client Progression</h2>
        </div>

        {/* Horizontal stage columns */}
        <div style={{ overflowX: "auto", paddingBottom: 8 }}>
          <div style={{ display: "flex", gap: 1, minWidth: CORP_STAGES.length * 200 }}>
            {CORP_STAGES.map((stage, si) => {
              const cards = stageGroups[stage] || [];
              const isLast = si === CORP_STAGES.length - 1;
              return (
                <div key={stage} style={{ flex: 1, minWidth: 180 }}>
                  {/* Stage header */}
                  <div style={{ background: CARD2, borderBottom: `2px solid ${si === 0 ? GOLD : si === CORP_STAGES.length - 1 ? GREEN : BORDER}`, padding: "10px 14px", marginBottom: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: si === 0 ? GOLD : si === CORP_STAGES.length - 1 ? GREEN : MUTED }}>{stage}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginTop: 4 }}>{cards.length}</div>
                  </div>

                  {/* Cards */}
                  <div style={{ background: CARD, minHeight: 120, padding: 4, border: `1px solid ${BORDER}`, borderTop: "none" }}>
                    {cards.length === 0 && (
                      <div style={{ padding: "16px 10px", textAlign: "center", color: DIM, fontSize: 11 }}>—</div>
                    )}
                    {cards.map(deal => (
                      <div key={deal.id} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "10px 12px", margin: "4px 0" }}>
                        <div style={{ fontSize: 13, color: TEXT, fontWeight: 600, marginBottom: 4 }}>{deal.account_name || deal.deal_name}</div>
                        <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, marginBottom: 4 }}>{fmtMoney(deal.amount)}</div>
                        <div style={{ fontSize: 10, color: DIM }}>{fmtDate(deal.created_time)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline totals */}
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {[
            { label: "Total Accounts", value: corpDeals.length },
            { label: "Total Value", value: fmtMoney(corpDeals.reduce((s, d) => s + (d.amount || 0), 0)) },
            { label: "Active", value: corpDeals.filter(d => d.stage === "Active" || d.stage === "Contracts Signed").length },
          ].map((s, i) => (
            <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, padding: "14px 16px", borderRadius: 4 }}>
              <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: i === 2 ? GREEN : GOLD, fontWeight: 400 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── OVERVIEW ──────────────────────────────────────────────────────────────
  const renderOverview = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Company header */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderTop: `3px solid ${GOLD}`, padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: TEXT, fontWeight: 400 }}>{co?.company_name || "—"}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>
              {co?.abn && <span>ABN {co.abn} · </span>}
              Ref: <span style={{ color: GOLD, fontFamily: "monospace" }}>{co?.client_ref || "—"}</span>
            </div>
          </div>
          <Tag label="Active" col={GREEN} bg="rgba(127,185,139,0.12)" />
        </div>
      </div>

      {/* KPI stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, background: BORDER }}>
        {[
          { label: "Total Nominees", value: co?.total_nominees ?? 0, col: TEXT },
          { label: "Total Fees", value: fmtMoney(totalFees), col: GOLD },
          { label: "NV1", value: co?.nv1_total ?? 0, col: BLUE },
          { label: "NV2", value: co?.nv2_total ?? 0, col: GOLD },
        ].map((s, i) => (
          <div key={i} style={{ background: CARD, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.14em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 28, color: s.col, fontWeight: 400 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Corporate pipeline preview */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>Corporate Pipeline</div>
          <button onClick={() => setPage("Pipeline")} style={{ fontSize: 11, color: GOLD, background: "none", border: `1px solid ${BORDER}`, padding: "4px 12px", cursor: "pointer", fontFamily: "inherit" }}>View →</button>
        </div>
        {/* Mini pipeline bar */}
        <div style={{ display: "flex", overflowX: "auto", padding: "12px 16px", gap: 8 }}>
          {CORP_STAGES.map((stage, si) => {
            const count = corpDeals.filter(d => d.stage === stage).length;
            return (
              <div key={stage} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{ background: count > 0 ? (si === CORP_STAGES.length - 1 ? GREEN : GOLD) : CARD2, border: `1px solid ${count > 0 ? (si === CORP_STAGES.length - 1 ? GREEN : GOLD) : BORDER}`, borderRadius: 4, padding: "6px 12px", textAlign: "center" as const }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: count > 0 ? (si === CORP_STAGES.length - 1 ? GREEN : GOLD) : DIM }}>{count}</div>
                  <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginTop: 2, maxWidth: 80, lineHeight: 1.3 }}>{stage}</div>
                </div>
                {si < CORP_STAGES.length - 1 && <div style={{ color: DIM, fontSize: 14 }}>›</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent personnel */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>Personnel ({personnel.length})</div>
          <button onClick={() => setPage("Personnel")} style={{ fontSize: 11, color: GOLD, background: "none", border: `1px solid ${BORDER}`, padding: "4px 12px", cursor: "pointer", fontFamily: "inherit" }}>View All →</button>
        </div>
        {personnel.slice(0, 5).map((p, i) => {
          const t = clrTag(p.clearance_type);
          return (
            <div key={p.id} onClick={() => setSelectedP(p)} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 16px", borderBottom: i < Math.min(4, personnel.length - 1) ? `1px solid ${BORDER}` : "none", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = CARD2}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: TEXT, fontWeight: 500 }}>{p.employee_name}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{p.stage || "—"}</div>
              </div>
              <Tag label={t.label} col={t.col} bg={t.bg} />
            </div>
          );
        })}
      </div>

      {/* Activity */}
      {activity.length > 0 && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>Recent Activity</div>
          </div>
          {activity.slice(0, 5).map((a, i) => (
            <div key={a.id} style={{ display: "flex", gap: 12, padding: "10px 16px", borderBottom: i < 4 ? `1px solid ${BORDER}` : "none", alignItems: "flex-start" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, flexShrink: 0, marginTop: 5 }} />
              <div>
                <div style={{ fontSize: 12, color: TEXT }}>{a.event}</div>
                <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{fmtDate(a.event_date)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── PERSONNEL ─────────────────────────────────────────────────────────────
  const renderPersonnel = () => (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: GOLD, textTransform: "uppercase" as const, letterSpacing: "0.2em", marginBottom: 4 }}>Nominated Employees</div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 400, color: TEXT, margin: 0 }}>{personnel.length} Personnel</h2>
        </div>
        <button style={{ fontSize: 11, color: BG, background: GOLD, border: "none", padding: "10px 18px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>+ Nominate</button>
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        {personnel.length === 0 && <div style={{ padding: 40, textAlign: "center", color: DIM, fontSize: 13 }}>No personnel nominated yet.</div>}
        {personnel.map((p, i) => {
          const t = clrTag(p.clearance_type);
          const isLast = p.stage?.toLowerCase().includes("granted") || p.stage?.toLowerCase().includes("complete");
          return (
            <div key={p.id} onClick={() => setSelectedP(p)}
              style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 16px", borderBottom: i < personnel.length - 1 ? `1px solid ${BORDER}` : "none", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = CARD2}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}>
              {/* Status dot */}
              <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: isLast ? GREEN : GOLD }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: TEXT, fontWeight: 500 }}>{p.employee_name}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{p.stage || "—"}</div>
                {p.email && <div style={{ fontSize: 11, color: DIM, marginTop: 1 }}>{p.email}</div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <Tag label={t.label} col={t.col} bg={t.bg} />
                {p.clearance_request_type && <Tag label={p.clearance_request_type} col={MUTED} bg="rgba(138,138,143,0.1)" />}
              </div>
              <div style={{ color: DIM, fontSize: 14, flexShrink: 0 }}>›</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── FINANCIALS ────────────────────────────────────────────────────────────
  const renderFinancials = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: GOLD, textTransform: "uppercase" as const, letterSpacing: "0.2em", marginBottom: 4 }}>Fee Summary</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 36, color: TEXT, fontWeight: 300 }}>{fmtMoney(totalFees)}</div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>Total across {co?.total_nominees || 0} nominees</div>
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, marginBottom: 12 }}>
        {[
          { label: "Application Fees", value: co?.total_application_fees, sub: `${co?.total_nominees || 0} × $400` },
          { label: "Year 1 Sponsorship", value: co?.total_sponsorship_fees, sub: "$1,460 per employee" },
          { label: "AGSVA Fees (pass-through)", value: co?.total_agsva_fees, sub: "Government cost at cost" },
          { label: "AusClear Fees (ex-AGSVA)", value: co?.total_fees_minus_agsva, sub: "Application + Sponsorship" },
        ].map((row, i, arr) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none" }}>
            <div>
              <div style={{ fontSize: 13, color: TEXT }}>{row.label}</div>
              {row.sub && <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{row.sub}</div>}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: GOLD, fontFamily: "monospace" }}>{fmtMoney(row.value)}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: BORDER }}>
        {[
          { label: "Baseline", value: co?.baseline_total ?? 0, col: MUTED },
          { label: "NV1", value: co?.nv1_total ?? 0, col: BLUE },
          { label: "NV2", value: co?.nv2_total ?? 0, col: GOLD },
        ].map((s, i) => (
          <div key={i} style={{ background: CARD, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: s.col }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── SUPPORT ───────────────────────────────────────────────────────────────
  const renderSupport = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: GOLD, textTransform: "uppercase" as const, letterSpacing: "0.2em", marginBottom: 4 }}>Contact</div>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 400, color: TEXT, margin: 0 }}>AusClear Support</h2>
      </div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, marginBottom: 12 }}>
        {[
          { label: "Phone", value: "1300 027 423" },
          { label: "Email", value: "support@ausclear.com.au" },
          { label: "Hours", value: "Mon–Fri, 9am–5pm ACST" },
        ].map((item, i, arr) => (
          <div key={i} style={{ padding: "14px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none" }}>
            <div style={{ fontSize: 10, color: GOLD, textTransform: "uppercase" as const, letterSpacing: "0.14em", marginBottom: 3 }}>{item.label}</div>
            <div style={{ fontSize: 13, color: TEXT }}>{item.value}</div>
          </div>
        ))}
      </div>
      <a href="https://support.ausclear.com.au" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, color: TEXT }}>Knowledge Base</div>
          <div style={{ fontSize: 11, color: GOLD }}>Visit →</div>
        </div>
      </a>
    </div>
  );

  const pages: Record<string, () => React.ReactElement> = {
    Overview: renderOverview, Pipeline: renderPipeline,
    Personnel: renderPersonnel, Financials: renderFinancials, Support: renderSupport,
  };

  // ── EMPLOYEE DRAWER ───────────────────────────────────────────────────────
  const Drawer = () => {
    if (!selectedP) return null;
    const p = selectedP;
    const t = clrTag(p.clearance_type);
    return (
      <>
        <div onClick={() => setSelectedP(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200 }} />
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 340, background: CARD, zIndex: 201, borderLeft: `1px solid ${BORDER}`, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ height: 3, background: `linear-gradient(90deg,${GOLD},transparent)` }} />
          <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: TEXT }}>{p.employee_name}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                <Tag label={t.label} col={t.col} bg={t.bg} />
                {p.clearance_request_type && <Tag label={p.clearance_request_type} col={MUTED} bg="rgba(138,138,143,0.1)" />}
              </div>
            </div>
            <button onClick={() => setSelectedP(null)} style={{ background: "none", border: `1px solid ${BORDER}`, cursor: "pointer", color: MUTED, padding: "4px 8px", fontFamily: "inherit" }}>✕</button>
          </div>
          <div style={{ padding: 20, flex: 1 }}>
            {[
              { label: "Stage", value: p.stage || "—" },
              { label: "Email", value: p.email || "—" },
              { label: "Clearance Level", value: p.clearance_type || "—" },
              { label: "Request Type", value: p.clearance_request_type || "New" },
              { label: "Batch Date", value: fmtDate(p.batch_date) },
              { label: "Status", value: p.onboarding_status || p.status || "—" },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < 5 ? `1px solid ${BORDER}` : "none" }}>
                <div style={{ fontSize: 10, color: GOLD, textTransform: "uppercase" as const, letterSpacing: "0.14em", marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: item.value === "—" ? DIM : TEXT }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${BORDER}`, borderTopColor: GOLD, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: MUTED, fontSize: 11, letterSpacing: "0.2em" }}>LOADING...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, padding: 32, textAlign: "center" }}>
        <p style={{ color: RED, fontSize: 13, marginBottom: 16 }}>{error}</p>
        <button onClick={() => router.push("/login")} style={{ background: GOLD, border: "none", padding: "10px 20px", color: BG, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Back to Login</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT }}>
      <Drawer />

      {/* Topbar */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: `${CARD}f0`, backdropFilter: "blur(10px)", borderBottom: `1px solid ${BORDER}`, padding: "0 16px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="https://ausclear.au/AusClear-Light-Transparent.png" alt="AusClear" style={{ height: 22 }} />
          <div style={{ width: 1, height: 20, background: BORDER }} />
          <span style={{ fontSize: 11, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>{co?.company_name || "Corporate"}</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: `1px solid ${BORDER}`, cursor: "pointer", padding: "6px 10px", color: MUTED, fontFamily: "inherit", fontSize: 13 }}>☰</button>
      </div>

      {/* Dropdown nav */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />
          <div style={{ position: "fixed", top: 52, right: 0, background: CARD, border: `1px solid ${BORDER}`, borderTop: "none", zIndex: 50, minWidth: 180 }}>
            {NAV.map(item => (
              <button key={item} onClick={() => { setPage(item); setMenuOpen(false); }}
                style={{ display: "block", width: "100%", padding: "12px 20px", border: "none", borderBottom: `1px solid ${BORDER}`, background: page === item ? "rgba(201,168,76,0.08)" : "transparent", color: page === item ? GOLD : TEXT, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left" as const }}>
                {item}
              </button>
            ))}
            <button onClick={() => router.push("/logout")} style={{ display: "block", width: "100%", padding: "12px 20px", border: "none", background: "transparent", color: MUTED, fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" as const }}>Sign Out</button>
          </div>
        </>
      )}

      {/* Tab nav */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "0 16px", display: "flex", gap: 0, overflowX: "auto" }}>
        {NAV.map(item => (
          <button key={item} onClick={() => setPage(item)}
            style={{ padding: "12px 16px", border: "none", borderBottom: page === item ? `2px solid ${GOLD}` : "2px solid transparent", background: "transparent", color: page === item ? GOLD : MUTED, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const, letterSpacing: "0.05em" }}>
            {item}
          </button>
        ))}
      </div>

      {/* Content */}
      <main style={{ padding: "20px 16px 60px", maxWidth: 900, margin: "0 auto" }}>
        {pages[page]?.()}
      </main>
    </div>
  );
}
