"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────
type Co = {
  company_name: string; abn: string; account_number: string; client_ref?: string;
  email: string; phone: string;
  total_nominees: number; new_total: number; upgrade_total: number; transfer_total: number;
  baseline_total: number; nv1_total: number; nv2_total: number;
  total_agsva_fees: number; total_application_fees: number;
  total_sponsorship_fees: number; total_fees_minus_agsva: number; corp_deal_stage?: string; corp_deal_amount?: number;
};
type P = {
  id: string; employee_name: string; email: string; mobile: string;
  clearance_type: string; clearance_request_type: string; stage: string; status: string;
  batch_date: string | null; onboarding_status?: string | null;
  revalidation_date?: string | null; linked_deal_name?: string | null;
};
type A = { id: string; event: string; event_date: string };
type Data = { company: Co; personnel: P[]; activity: A[]; user: { email: string } };

// ── Corporate pipeline stages ─────────────────────────────────────────────────
// Client-friendly labels for Zoho stage names
const STAGE_LABELS: Record<string, string> = {
  "Onboard Corporate Account": "Account Setup",
  "Prepare Contract":          "Preparing Agreement",
  "Contract Sent":             "Agreement Sent",
  "Awaiting Signature":        "Awaiting Signature",
  "Contracts Signed":          "Agreement Signed",
  "Create Invoice":            "Invoice Preparation",
  "Invoice Sent":              "Invoice Sent",
  "Invoice Outstanding":       "Payment Pending",
  "Invoice Paid":              "Payment Received",
  "Corporate Approved":        "Active & Approved",
};
// Stages come from Zoho API — not hardcoded
// CORP_STAGES is set dynamically from co.pipeline_stages after data loads

// ── Helpers ───────────────────────────────────────────────────────────────────
const $k = (n?: number | null) => n != null ? `$${Number(n).toLocaleString("en-AU")}` : "—";
const $d = (s?: string | null) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return s; }
};
const clr = (c: string) =>
  c?.includes("NV2") ? { label: "NV2", col: "#c9a84c", bg: "rgba(201,168,76,0.15)", bdr: "rgba(201,168,76,0.4)" } :
  c?.includes("NV1") ? { label: "NV1", col: "#6b9fd4", bg: "rgba(107,159,212,0.15)", bdr: "rgba(107,159,212,0.4)" } :
                       { label: "BSL", col: "#7a7a82", bg: "rgba(122,122,130,0.15)", bdr: "rgba(122,122,130,0.35)" };

function Tag({ t }: { t: ReturnType<typeof clr> }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const,
      color: t.col, background: t.bg, border: `1px solid ${t.bdr}`, padding: "2px 8px", borderRadius: 3 }}>
      {t.label}
    </span>
  );
}

// ── SVG Chevron Pipeline ──────────────────────────────────────────────────────
// Uses SVG polygons — works in every browser, no CSS pseudo-element issues
function ChevronPipeline({ stages, activeStage }: { stages: string[]; activeStage: string }) {
  const H = 34;
  const TIP = 11;
  const W = 150;
  const OVERLAP = TIP;
  const totalW = stages.length * W - (stages.length - 1) * OVERLAP;
  const activeIdx = stages.indexOf(activeStage);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg height={H} width={totalW} style={{ display: "block", minWidth: totalW }}>
        {stages.map((stage, i) => {
          const x = i * (W - OVERLAP);
          const isActive = i === activeIdx;
          const isDone   = i < activeIdx;
          const isFirst  = i === 0;
          const isLast   = i === stages.length - 1;

          let pts: string;
          if (isFirst && isLast) {
            pts = `${x},0 ${x+W},0 ${x+W},${H} ${x},${H}`;
          } else if (isFirst) {
            pts = `${x},0 ${x+W-TIP},0 ${x+W},${H/2} ${x+W-TIP},${H} ${x},${H}`;
          } else if (isLast) {
            pts = `${x},0 ${x+W},0 ${x+W},${H} ${x},${H} ${x+TIP},${H/2}`;
          } else {
            pts = `${x},0 ${x+W-TIP},0 ${x+W},${H/2} ${x+W-TIP},${H} ${x},${H} ${x+TIP},${H/2}`;
          }

          const fill = isActive ? "#1e4a8c" : isDone ? "#163d6e" : "#1a1f2e";
          const tCol = isActive ? "#fff" : isDone ? "rgba(255,255,255,0.6)" : "#3a3a52";
          const tLeft  = isFirst ? x + 6 : x + TIP + 5;
          const tRight = isLast  ? x + W - 6 : x + W - TIP - 5;
          const tCx    = (tLeft + tRight) / 2;
          const label  = (STAGE_LABELS[stage] || stage).toUpperCase();

          return (
            <g key={stage}>
              <polygon points={pts} fill={fill} />
              <text
                x={tCx} y={H / 2}
                dominantBaseline="middle" textAnchor="middle"
                fill={tCol} fontSize={8} fontWeight={isActive ? 700 : 600}
                fontFamily="-apple-system,sans-serif"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab]           = useState<"overview"|"pipeline"|"personnel"|"financials">("overview");
  const [data, setData]         = useState<Data | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
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
  const fees = co ? co.total_agsva_fees + co.total_application_fees + co.total_sponsorship_fees : 0;

  // Current account stage — from Zoho we know NETFLIX is "Onboard Corporate Account"
  const accountStage   = co?.corp_deal_stage || "Onboard Corporate Account";
  const CORP_STAGES    = co?.pipeline_stages || Object.keys(STAGE_LABELS);

  // ── OVERVIEW ──────────────────────────────────────────────────────────────
  const Overview = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Company header */}
      <div style={{ background: "#111318", border: "1px solid #252b38", borderTop: "2px solid #c9a84c", padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#e8e5de", marginBottom: 4 }}>{co?.company_name || "—"}</div>
            <div style={{ fontSize: 12, color: "#7a7a82" }}>
              {co?.abn && <span>ABN {co.abn} &nbsp;·&nbsp; </span>}
              Account: <span style={{ color: "#c9a84c", fontFamily: "monospace", fontWeight: 700 }}>{co?.account_number || "—"}</span>
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#5cb87a", background: "rgba(92,184,122,0.12)", border: "1px solid rgba(92,184,122,0.35)", padding: "4px 12px", borderRadius: 4 }}>Active</span>
        </div>
      </div>

      {/* KPI stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 1, background: "#252b38" }}>
        {[
          { label: "Nominees",   value: co?.total_nominees ?? 0, col: "#e8e5de" },
          { label: "Total Fees", value: $k(fees),                col: "#c9a84c" },
          { label: "NV1",        value: co?.nv1_total ?? 0,       col: "#6b9fd4" },
          { label: "NV2",        value: co?.nv2_total ?? 0,       col: "#c9a84c" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#111318", padding: "16px 18px" }}>
            <div style={{ fontSize: 10, color: "#7a7a82", textTransform: "uppercase" as const, letterSpacing: "0.14em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.col, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Corporate pipeline preview */}
      <div style={{ background: "#111318", border: "1px solid #252b38" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #252b38", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e8e5de" }}>Corporate Pipeline</span>
          <button onClick={() => setTab("pipeline")} style={{ fontSize: 11, color: "#c9a84c", background: "none", border: "none", cursor: "pointer", padding: 0 }}>View →</button>
        </div>
        <div style={{ padding: "12px 18px 14px" }}>
          <ChevronPipeline stages={CORP_STAGES} activeStage={accountStage} />
        </div>
      </div>

      {/* Personnel preview */}
      <div style={{ background: "#111318", border: "1px solid #252b38" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #252b38", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e8e5de" }}>Personnel ({ppl.length})</span>
          <button onClick={() => setTab("personnel")} style={{ fontSize: 11, color: "#c9a84c", background: "none", border: "none", cursor: "pointer", padding: 0 }}>View all →</button>
        </div>
        {ppl.slice(0, 4).map((p, i) => {
          const t = clr(p.clearance_type);
          return (
            <div key={p.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 18px",
              borderBottom: i < Math.min(3, ppl.length - 1) ? "1px solid #252b38" : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#e8e5de" }}>{p.employee_name}</div>
                <div style={{ fontSize: 11, color: "#7a7a82", marginTop: 2 }}>{p.stage || "—"}</div>
              </div>
              <Tag t={t} />
            </div>
          );
        })}
      </div>

      {act.length > 0 && (
        <div style={{ background: "#111318", border: "1px solid #252b38" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid #252b38" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#e8e5de" }}>Recent Activity</span>
          </div>
          {act.slice(0, 5).map((a, i) => (
            <div key={a.id} style={{ display: "flex", gap: 12, padding: "10px 18px",
              borderBottom: i < 4 ? "1px solid #252b38" : "none", alignItems: "flex-start" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#c9a84c", flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1, fontSize: 12, color: "#e8e5de" }}>{a.event}</div>
              <div style={{ fontSize: 11, color: "#4a4a52", whiteSpace: "nowrap" as const }}>{$d(a.event_date)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── PIPELINE ──────────────────────────────────────────────────────────────
  const Pipeline = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontSize: 11, color: "#c9a84c", textTransform: "uppercase" as const, letterSpacing: "0.2em", marginBottom: 4 }}>Corporate Onboarding</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#e8e5de" }}>{co?.company_name || "—"} · <span style={{ color: "#c9a84c", fontFamily: "monospace" }}>{co?.account_number || "—"}</span></div>
      </div>

      {/* Batch deal card — the actual Zoho deal this pipeline belongs to */}
      {co?.corp_deal_name && (
        <div style={{ background: "#111318", border: "1px solid #252b38", borderLeft: "3px solid #c9a84c", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: "#c9a84c", textTransform: "uppercase" as const, letterSpacing: "0.15em", marginBottom: 4 }}>Batch Deal</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e8e5de", fontFamily: "monospace" }}>{co.corp_deal_name}</div>
            {co.corp_deal_created && (
              <div style={{ fontSize: 11, color: "#7a7a82", marginTop: 3 }}>Created {$d(co.corp_deal_created)}</div>
            )}
          </div>
          {co.corp_deal_amount > 0 && (
            <div style={{ fontSize: 18, fontWeight: 700, color: "#c9a84c", fontFamily: "monospace" }}>{$k(co.corp_deal_amount)}</div>
          )}
        </div>
      )}

      {/* Chevron pipeline — stage from the actual deal */}
      <div style={{ background: "#111318", border: "1px solid #252b38", padding: "16px 18px" }}>
        <ChevronPipeline stages={CORP_STAGES} activeStage={accountStage} />
        <div style={{ marginTop: 10, fontSize: 12, color: "#7a7a82" }}>
          Current stage: <span style={{ color: "#c9a84c", fontWeight: 600 }}>{STAGE_LABELS[accountStage] || accountStage}</span>
        </div>
      </div>

      {/* Stage list */}
      <div style={{ background: "#111318", border: "1px solid #252b38" }}>
        {CORP_STAGES.map((stage, i) => {
          const isActive = stage === accountStage;
          const isDone   = CORP_STAGES.indexOf(stage) < CORP_STAGES.indexOf(accountStage);
          return (
            <div key={stage} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 18px",
              borderBottom: i < CORP_STAGES.length - 1 ? "1px solid #252b38" : "none",
              background: isActive ? "rgba(30,74,140,0.15)" : "transparent" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background: isActive ? "#c9a84c" : isDone ? "#5cb87a" : "#252b38",
                border: isActive || isDone ? "none" : "2px solid #3a3a52" }} />
              <div style={{ flex: 1, fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? "#e8e5de" : isDone ? "rgba(255,255,255,0.45)" : "#3a3a52" }}>
                {STAGE_LABELS[stage] || stage}
              </div>
              {isActive && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#c9a84c",
                  background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)",
                  padding: "2px 8px", borderRadius: 3, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                  Current
                </span>
              )}
              {isDone && <span style={{ fontSize: 11, color: "#5cb87a" }}>✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── PERSONNEL ─────────────────────────────────────────────────────────────
  const Personnel = () => (
    <div>
      <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#e8e5de" }}>
          Personnel <span style={{ fontSize: 14, color: "#7a7a82", fontWeight: 400 }}>({ppl.length})</span>
        </div>
        <button style={{ background: "#c9a84c", border: "none", padding: "9px 18px", color: "#07070a", fontWeight: 700, fontSize: 12, cursor: "pointer", borderRadius: 4 }}>+ Nominate</button>
      </div>
      <div style={{ background: "#111318", border: "1px solid #252b38" }}>
        {ppl.length === 0 && <div style={{ padding: 40, textAlign: "center" as const, color: "#4a4a52" }}>No personnel nominated.</div>}
        {ppl.map((p, i) => {
          const open = expanded === p.id;
          const t = clr(p.clearance_type);
          return (
            <div key={p.id} style={{ borderBottom: i < ppl.length - 1 ? "1px solid #252b38" : "none" }}>
              {/* Row */}
              <div
                onClick={() => setExpanded(open ? null : p.id)}
                style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 18px", cursor: "pointer",
                  background: open ? "#161922" : "transparent" }}
                onMouseEnter={e => { if (!open) (e.currentTarget as HTMLDivElement).style.background = "#161922"; }}
                onMouseLeave={e => { if (!open) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: "#c9a84c" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e5de" }}>{p.employee_name}</div>
                  <div style={{ fontSize: 11, color: "#7a7a82", marginTop: 2 }}>{p.stage || "—"}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  <Tag t={t} />
                  {p.clearance_request_type && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#7a7a82",
                      background: "rgba(122,122,130,0.12)", border: "1px solid rgba(122,122,130,0.3)",
                      padding: "2px 7px", borderRadius: 3 }}>{p.clearance_request_type}</span>
                  )}
                  <span style={{ color: "#4a4a52", fontSize: 16, display: "inline-block",
                    transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>›</span>
                </div>
              </div>

              {/* Expanded inline detail */}
              {open && (
                <div style={{ background: "#161922", borderTop: "1px solid #252b38", padding: "16px 18px 20px 40px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 32px" }}>
                    {[
                      { label: "Email",           value: p.email || "—" },
                      { label: "Mobile",          value: p.mobile || "—" },
                      { label: "Clearance Level", value: p.clearance_type || "—" },
                      { label: "Request Type",    value: p.clearance_request_type || "New" },
                      { label: "Stage",           value: p.stage || "—" },
                      { label: "Onboarding",      value: p.onboarding_status || "—" },
                      { label: "Batch Date",      value: $d(p.batch_date) },
                      { label: "Revalidation",    value: $d(p.revalidation_date || null) },
                      { label: "Linked Deal",     value: p.linked_deal_name || "—" },
                    ].map((row, ri) => (
                      <div key={ri}>
                        <div style={{ fontSize: 10, color: "#c9a84c", textTransform: "uppercase" as const,
                          letterSpacing: "0.12em", fontWeight: 700, marginBottom: 3 }}>{row.label}</div>
                        <div style={{ fontSize: 13, color: row.value === "—" ? "#4a4a52" : "#e8e5de" }}>{row.value}</div>
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

  // ── FINANCIALS ────────────────────────────────────────────────────────────
  const Financials = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "#111318", border: "1px solid #252b38", borderTop: "2px solid #c9a84c", padding: "20px 22px" }}>
        <div style={{ fontSize: 11, color: "#c9a84c", textTransform: "uppercase" as const, letterSpacing: "0.2em", marginBottom: 4 }}>Total</div>
        <div style={{ fontSize: 38, fontWeight: 700, color: "#e8e5de" }}>{$k(fees)}</div>
        <div style={{ fontSize: 12, color: "#7a7a82", marginTop: 4 }}>{co?.total_nominees || 0} sponsored employees</div>
      </div>
      <div style={{ background: "#111318", border: "1px solid #252b38" }}>
        {[
          { label: "Application Fees",        value: co?.total_application_fees,  note: `${co?.total_nominees || 0} × $400` },
          { label: "Year 1 Sponsorship",       value: co?.total_sponsorship_fees,  note: "$1,460 per employee" },
          { label: "AGSVA Pass-Through",       value: co?.total_agsva_fees,        note: "Government vetting at cost" },
          { label: "AusClear Fees (ex-AGSVA)", value: co?.total_fees_minus_agsva,  note: "App + Sponsorship" },
        ].map((row, i, arr) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 18px", borderBottom: i < arr.length - 1 ? "1px solid #252b38" : "none" }}>
            <div>
              <div style={{ fontSize: 13, color: "#e8e5de" }}>{row.label}</div>
              <div style={{ fontSize: 11, color: "#4a4a52", marginTop: 2 }}>{row.note}</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#c9a84c", fontFamily: "monospace" }}>{$k(row.value)}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "#252b38" }}>
        {[
          { label: "New",      value: co?.new_total ?? 0,      col: "#5cb87a" },
          { label: "Upgrades", value: co?.upgrade_total ?? 0,  col: "#d4935c" },
          { label: "Transfers",value: co?.transfer_total ?? 0, col: "#6b9fd4" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#111318", padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: "#7a7a82", textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.col }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── LOADING / ERROR ───────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#07070a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" as const }}>
        <div style={{ width: 32, height: 32, border: "2px solid #252b38", borderTopColor: "#c9a84c",
          borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#7a7a82", fontSize: 11, letterSpacing: "0.2em" }}>LOADING...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#07070a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#111318", border: "1px solid #252b38", padding: 32, textAlign: "center" as const }}>
        <p style={{ color: "#c97a7a", marginBottom: 16 }}>{error}</p>
        <button onClick={() => router.push("/login")} style={{ background: "#c9a84c", border: "none", padding: "10px 22px", color: "#07070a", fontWeight: 700, cursor: "pointer" }}>Back to Login</button>
      </div>
    </div>
  );

  // ── SHELL ─────────────────────────────────────────────────────────────────
  const TABS = [
    { key: "overview",   label: "Overview"   },
    { key: "pipeline",   label: "Pipeline"   },
    { key: "personnel",  label: "Personnel"  },
    { key: "financials", label: "Financials" },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "#07070a", color: "#e8e5de",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* Topbar */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(17,19,24,0.96)",
        backdropFilter: "blur(12px)", borderBottom: "1px solid #252b38",
        padding: "0 20px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="https://ausclear.au/AusClear-Dark-Transparent.png" alt="AusClear" style={{ height: 22 }} />
          <div style={{ width: 1, height: 18, background: "#252b38" }} />
          <span style={{ fontSize: 12, color: "#7a7a82" }}>{co?.company_name || "Corporate Portal"}</span>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "1px solid #252b38",
            padding: "6px 12px", color: "#7a7a82", cursor: "pointer", fontSize: 13 }}>☰</button>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />
              <div style={{ position: "absolute", right: 0, top: 36, background: "#111318",
                border: "1px solid #252b38", zIndex: 50, minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
                {TABS.map(t => (
                  <button key={t.key} onClick={() => { setTab(t.key); setMenuOpen(false); }}
                    style={{ display: "block", width: "100%", padding: "11px 18px", border: "none",
                      borderBottom: "1px solid #252b38", background: tab === t.key ? "rgba(201,168,76,0.08)" : "transparent",
                      color: tab === t.key ? "#c9a84c" : "#e8e5de", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
                    {t.label}
                  </button>
                ))}
                <button onClick={() => router.push("/logout")} style={{ display: "block", width: "100%",
                  padding: "11px 18px", border: "none", background: "transparent", color: "#7a7a82",
                  fontSize: 12, cursor: "pointer", textAlign: "left" as const }}>Sign Out</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: "1px solid #252b38", padding: "0 20px", display: "flex", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: "13px 18px", border: "none",
              borderBottom: tab === t.key ? "2px solid #c9a84c" : "2px solid transparent",
              background: "transparent", color: tab === t.key ? "#c9a84c" : "#7a7a82",
              fontSize: 13, fontWeight: tab === t.key ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap" as const }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "20px 20px 60px" }}>
        {tab === "overview"   && <Overview />}
        {tab === "pipeline"   && <Pipeline />}
        {tab === "personnel"  && <Personnel />}
        {tab === "financials" && <Financials />}
      </main>
    </div>
  );
}
