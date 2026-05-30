"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// ── Colours ───────────────────────────────────────────────────────────────────
const C = {
  bg:    "#07070a",
  side:  "#0d1018",
  card:  "#111318",
  card2: "#161922",
  line:  "#1f2535",
  gold:  "#c9a84c",
  goldD: "rgba(201,168,76,0.12)",
  text:  "#e8e5de",
  muted: "#7a7a82",
  dim:   "#4a4a52",
  green: "#5cb87a",
  blue:  "#6b9fd4",
  amber: "#d4935c",
  red:   "#c97a7a",
};

// ── Stage labels ──────────────────────────────────────────────────────────────
const SL: Record<string, string> = {
  // Corporate account pipeline
  "Onboard Corporate Account": "Account Setup",
  "Prepare Contract":          "Preparing Agreement",
  "Send Contract":             "Agreement Sent",
  "Contract Sent":             "Agreement Sent",
  "Awaiting Signature":        "Awaiting Signature",
  "Contracts Signed":          "Agreement Signed",
  "Contract Signed":           "Agreement Signed",
  "Create Invoice":            "Invoice Preparation",
  "Invoice Sent":              "Invoice Sent",
  "Invoice Outstanding":       "Payment Pending",
  "Invoice Paid":              "Payment Received",
  "Corporate Approved":        "Active & Approved",
  "Corporate Declined":        "Declined",
  // Corporate employee pipeline
  "Sponsorship Created":       "Sponsorship Created",
  "Onboard Employee for ESC":  "Commencing Employment Screening",
  "ESC Pending":               "Screening Underway",
  "ESC Completed":             "Screening Complete",
  "ESC Approved":              "Screening Approved",
  "AGSVA Portal Access":       "Activating AGSVA Portal",
  "AGSVA Portal":              "AGSVA Portal Active",
  "AGSVA Clearance Onboard":   "Lodging Security Application",
  "AGSVA Clearance Pending":   "Vetting Assessment Underway",
  "AGSVA Clearance Granted":   "Security Clearance Granted",
  "ESC Denied":                "Screening Denied",
  "AGSVA Clearance Denied":    "Security Clearance Denied",
  "Closed Lost":               "Closed",
  "Closed Won":                "Completed",
};
const lbl = (s: string) => SL[s] || s;

const CORP_STAGES = [
  "Onboard Corporate Account","Prepare Contract","Contract Sent",
  "Awaiting Signature","Contracts Signed","Create Invoice",
  "Invoice Sent","Invoice Outstanding","Invoice Paid","Corporate Approved",
];

// ── Types ─────────────────────────────────────────────────────────────────────
type Co = {
  company_name: string; abn: string; account_number: string;
  total_nominees: number; new_total: number; upgrade_total: number; transfer_total: number;
  baseline_total: number; nv1_total: number; nv2_total: number;
  total_agsva_fees: number; total_application_fees: number;
  total_sponsorship_fees: number; total_fees_minus_agsva: number; total_fees: number;
  corp_deal_stage: string; corp_deal_name?: string; corp_deal_amount?: number; corp_deal_created?: string;
};
type P = {
  id: string; employee_name: string; email: string; mobile: string;
  clearance_type: string; clearance_request_type: string; stage: string;
  onboarding_status: string; batch_date: string | null; linked_deal_name: string | null;
  employee_number: number | null; revalidation_date: string | null;
};
type A = { id: string; event: string; event_date: string };
type Batch = {
  id: string; deal_name: string; stage: string; amount: number;
  created_time: string; batch_date: string; nominee_count: number;
  baseline_count: number; nv1_count: number; nv2_count: number;
  upgrade_count: number; new_count: number;
  agsva_fees: number; app_fees: number; sponsor_fees: number;
  total_fees: number; ex_agsva: number; nominees: P[];
};
type Data = { company: Co; personnel: P[]; activity: A[]; batches: Batch[]; user: { email: string } };

// ── Helpers ───────────────────────────────────────────────────────────────────
const $k = (n?: number | null) => n != null ? `$${Number(n).toLocaleString("en-AU")}` : "—";
const $d = (s?: string | null) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return s; }
};
const clrTag = (c: string) =>
  c?.includes("NV2") ? { label:"NV2", col:C.gold,  bg:"rgba(201,168,76,0.15)",  bdr:"rgba(201,168,76,0.4)"  } :
  c?.includes("NV1") ? { label:"NV1", col:C.blue,  bg:"rgba(107,159,212,0.15)", bdr:"rgba(107,159,212,0.4)" } :
                       { label:"BSL", col:C.muted, bg:"rgba(122,122,130,0.12)", bdr:"rgba(122,122,130,0.3)" };

function Pill({ t }: { t: { label:string; col:string; bg:string; bdr:string } }) {
  return <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase" as const,
    color:t.col, background:t.bg, border:`1px solid ${t.bdr}`, padding:"2px 8px", borderRadius:3 }}>{t.label}</span>;
}

// ── SVG Chevron Pipeline ──────────────────────────────────────────────────────
function Chevrons({ stages, active }: { stages: string[]; active: string }) {
  const H=34, TIP=11, W=150, OVR=TIP;
  const totalW = stages.length * W - (stages.length - 1) * OVR;
  const activeIdx = stages.indexOf(active);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ on:false, sx:0, sl:0 });

  const onMD = (e: React.MouseEvent) => {
    if (!ref.current) return;
    drag.current = { on:true, sx:e.pageX - ref.current.offsetLeft, sl:ref.current.scrollLeft };
    ref.current.style.cursor = "grabbing";
  };
  const onMM = (e: React.MouseEvent) => {
    if (!drag.current.on || !ref.current) return;
    e.preventDefault();
    ref.current.scrollLeft = drag.current.sl - (e.pageX - ref.current.offsetLeft - drag.current.sx);
  };
  const onMU = () => { drag.current.on = false; if (ref.current) ref.current.style.cursor = "grab"; };

  return (
    <div ref={ref} onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
      style={{ overflowX:"auto", cursor:"grab", userSelect:"none", scrollbarWidth:"none" }}>
      <svg height={H} width={totalW} style={{ display:"block", minWidth:totalW }}>
        {stages.map((stage, i) => {
          const x = i * (W - OVR);
          const isActive = i === activeIdx;
          const isDone   = i < activeIdx;
          const isFirst  = i === 0;
          const isLast   = i === stages.length - 1;
          let pts: string;
          if (isFirst && isLast) pts = `${x},0 ${x+W},0 ${x+W},${H} ${x},${H}`;
          else if (isFirst)      pts = `${x},0 ${x+W-TIP},0 ${x+W},${H/2} ${x+W-TIP},${H} ${x},${H}`;
          else if (isLast)       pts = `${x},0 ${x+W},0 ${x+W},${H} ${x},${H} ${x+TIP},${H/2}`;
          else                   pts = `${x},0 ${x+W-TIP},0 ${x+W},${H/2} ${x+W-TIP},${H} ${x},${H} ${x+TIP},${H/2}`;
          const fill = isActive ? "#1e4a8c" : isDone ? "#163d6e" : "#1a1f2e";
          const tCol = isActive ? "#fff" : isDone ? "rgba(255,255,255,0.6)" : "#3a3a52";
          const tCx  = ((isFirst ? x+6 : x+TIP+5) + (isLast ? x+W-6 : x+W-TIP-5)) / 2;
          return (
            <g key={stage}>
              <polygon points={pts} fill={fill} />
              <text x={tCx} y={H/2} dominantBaseline="middle" textAnchor="middle"
                fill={tCol} fontSize={8} fontWeight={isActive?700:600}
                fontFamily="-apple-system,sans-serif" style={{ pointerEvents:"none" }}>
                {lbl(stage).toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, top }: { children: React.ReactNode; top?: string }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.line}`, borderTop:top?`2px solid ${top}`:"none" }}>
      {children}
    </div>
  );
}
function CardRow({ label, btn, onClick }: { label:string; btn?:string; onClick?:()=>void }) {
  return (
    <div style={{ padding:"12px 18px", borderBottom:`1px solid ${C.line}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{label}</span>
      {btn && <button onClick={onClick} style={{ fontSize:11, color:C.gold, background:"none", border:"none", cursor:"pointer", padding:0 }}>{btn}</button>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab,      setTab]      = useState<"overview"|"batches"|"personnel"|"financials">("overview");
  const [data,     setData]     = useState<Data | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedP, setExpandedP] = useState<string | null>(null);
  const [expandedB, setExpandedB] = useState<string | null>(null);
  const [expandedE, setExpandedE] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    fetch("/api/dashboard/data").then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const co      = data?.company;
  const ppl     = data?.personnel || [];
  const act     = data?.activity  || [];
  const batches = data?.batches   || [];
  const fees    = co ? co.total_agsva_fees + co.total_application_fees + co.total_sponsorship_fees : 0;
  const accountStage = co?.corp_deal_stage || "Onboard Corporate Account";

  // ── OVERVIEW ────────────────────────────────────────────────────────────────
  const Overview = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {isMobile && (
        <Card top={C.gold}>
          <div style={{ padding:"18px 20px" }}>
            <div style={{ fontSize:22, fontWeight:700, color:C.text, marginBottom:4 }}>{co?.company_name}</div>
            <div style={{ fontSize:12, color:C.muted }}>
              {co?.abn && <span>ABN {co.abn} &nbsp;·&nbsp; </span>}
              Account: <span style={{ color:C.gold, fontFamily:"monospace", fontWeight:700 }}>{co?.account_number || "—"}</span>
            </div>
          </div>
        </Card>
      )}

      {isMobile && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:1, background:C.line }}>
          {[
            { label:"Nominees",  value:co?.total_nominees??0, col:C.text },
            { label:"Total Fees",value:$k(fees),              col:C.gold },
            { label:"Baseline",  value:co?.baseline_total??0, col:C.muted },
            { label:"NV1",       value:co?.nv1_total??0,      col:C.blue },
            { label:"NV2",       value:co?.nv2_total??0,      col:C.gold },
            { label:"New",       value:co?.new_total??0,      col:C.green },
          ].map((s,i) => (
            <div key={i} style={{ background:C.card, padding:"14px 16px" }}>
              <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase" as const, letterSpacing:"0.14em", marginBottom:6 }}>{s.label}</div>
              <div style={{ fontSize:24, fontWeight:700, color:s.col }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardRow label="Current Batch Stage" btn="View →" onClick={() => setTab("batches")} />
        <div style={{ padding:"12px 18px 14px" }}>
          <Chevrons stages={CORP_STAGES} active={accountStage} />
          {co?.corp_deal_name && (
            <div style={{ marginTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:11, color:C.muted }}>
                <span style={{ color:C.text, fontWeight:600 }}>{co.corp_deal_name}</span>
                {co.corp_deal_created && <span style={{ color:C.dim }}> · {$d(co.corp_deal_created)}</span>}
              </div>
              {(co.corp_deal_amount ?? 0) > 0 &&
                <span style={{ fontSize:13, fontWeight:700, color:C.gold, fontFamily:"monospace" }}>{$k(co.corp_deal_amount)}</span>
              }
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardRow label={`Personnel (${ppl.length})`} btn="View all →" onClick={() => setTab("personnel")} />
        {ppl.slice(0,4).map((p,i) => (
          <div key={p.id} style={{ display:"flex", gap:12, alignItems:"center", padding:"11px 18px",
            borderBottom:i<Math.min(3,ppl.length-1)?`1px solid ${C.line}`:"none" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:500, color:C.text }}>{p.employee_name}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{lbl(p.stage) || "—"}</div>
            </div>
            <Pill t={clrTag(p.clearance_type)} />
          </div>
        ))}
      </Card>

      {act.length > 0 && (
        <Card>
          <CardRow label="Recent Activity" />
          {act.slice(0,5).map((a,i) => (
            <div key={a.id} style={{ display:"flex", gap:12, padding:"10px 18px",
              borderBottom:i<4?`1px solid ${C.line}`:"none", alignItems:"flex-start" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:C.gold, flexShrink:0, marginTop:5 }} />
              <div style={{ flex:1, fontSize:12, color:C.text }}>{a.event}</div>
              <div style={{ fontSize:11, color:C.dim, whiteSpace:"nowrap" as const }}>{$d(a.event_date)}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );

  // ── BATCHES ──────────────────────────────────────────────────────────────────
  const Batches = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <div style={{ fontSize:11, color:C.gold, textTransform:"uppercase" as const, letterSpacing:"0.2em", marginBottom:4 }}>Nominated Employee Batches</div>
        <div style={{ fontSize:20, fontWeight:700, color:C.text }}>
          {co?.company_name} · <span style={{ fontFamily:"monospace", color:C.gold }}>{co?.account_number}</span>
        </div>
      </div>

      <Card>
        <div style={{ padding:"10px 18px", borderBottom:`1px solid ${C.line}` }}>
          <div style={{ fontSize:10, color:C.gold, textTransform:"uppercase" as const, letterSpacing:"0.15em", fontWeight:700, marginBottom:8 }}>Current Batch Stage</div>
          <Chevrons stages={CORP_STAGES} active={accountStage} />
        </div>
      </Card>

      {batches.map((batch) => {
        const bOpen = expandedB === batch.id;
        return (
          <Card key={batch.id} top={C.gold}>
            {/* Batch header */}
            <div onClick={() => setExpandedB(bOpen ? null : batch.id)}
              style={{ padding:"14px 18px", cursor:"pointer", display:"flex", justifyContent:"space-between",
                alignItems:"flex-start", gap:12, flexWrap:"wrap" as const }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = C.card2}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{batch.deal_name}</div>
                <div style={{ fontSize:11, color:C.muted, display:"flex", gap:12, flexWrap:"wrap" as const }}>
                  <span>Stage: <span style={{ color:C.gold, fontWeight:600 }}>{lbl(batch.stage)}</span></span>
                  <span>Batch: <span style={{ color:C.text }}>{$d(batch.batch_date)}</span></span>
                  <span>Created: <span style={{ color:C.text }}>{$d(batch.created_time)}</span></span>
                  <span>{batch.nominee_count} employee{batch.nominee_count !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div style={{ display:"flex", gap:12, alignItems:"center", flexShrink:0 }}>
                <div style={{ fontSize:18, fontWeight:700, color:C.gold, fontFamily:"monospace" }}>{$k(batch.amount)}</div>
                <span style={{ color:C.dim, fontSize:16, display:"inline-block",
                  transform:bOpen?"rotate(90deg)":"rotate(0deg)", transition:"transform 0.2s" }}>›</span>
              </div>
            </div>

            {bOpen && (
              <div style={{ borderTop:`1px solid ${C.line}` }}>
                {/* Financials */}
                <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.line}`, background:C.side }}>
                  <div style={{ fontSize:10, color:C.gold, textTransform:"uppercase" as const, letterSpacing:"0.15em", fontWeight:700, marginBottom:12 }}>Batch Financials</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:1, background:C.line, marginBottom:12 }}>
                    {[
                      { label:"Application Fees", value:$k(batch.app_fees),    note:`${batch.nominee_count} × $400` },
                      { label:"Sponsorship Fees", value:$k(batch.sponsor_fees),note:"$1,460 per employee" },
                      { label:"AGSVA Fees",        value:$k(batch.agsva_fees),  note:"Government at cost" },
                      { label:"AusClear Total",    value:$k(batch.ex_agsva),    note:"Ex-AGSVA" },
                    ].map((row,i) => (
                      <div key={i} style={{ background:C.card, padding:"12px 14px" }}>
                        <div style={{ fontSize:9, color:C.muted, textTransform:"uppercase" as const, letterSpacing:"0.12em", marginBottom:4 }}>{row.label}</div>
                        <div style={{ fontSize:18, fontWeight:700, color:C.gold, marginBottom:2 }}>{row.value}</div>
                        <div style={{ fontSize:10, color:C.dim }}>{row.note}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:14, flexWrap:"wrap" as const }}>
                    {batch.baseline_count > 0 && <span style={{ fontSize:11, color:C.muted }}>Baseline: <strong style={{ color:C.text }}>{batch.baseline_count}</strong></span>}
                    {batch.nv1_count     > 0 && <span style={{ fontSize:11, color:C.muted }}>NV1: <strong style={{ color:C.blue }}>{batch.nv1_count}</strong></span>}
                    {batch.nv2_count     > 0 && <span style={{ fontSize:11, color:C.muted }}>NV2: <strong style={{ color:C.gold }}>{batch.nv2_count}</strong></span>}
                    {batch.new_count     > 0 && <span style={{ fontSize:11, color:C.muted }}>New: <strong style={{ color:C.green }}>{batch.new_count}</strong></span>}
                    {batch.upgrade_count > 0 && <span style={{ fontSize:11, color:C.muted }}>Upgrades: <strong style={{ color:C.amber }}>{batch.upgrade_count}</strong></span>}
                  </div>
                </div>

                {/* Employees */}
                <div style={{ padding:"10px 18px 4px", borderBottom:`1px solid ${C.line}` }}>
                  <div style={{ fontSize:10, color:C.gold, textTransform:"uppercase" as const, letterSpacing:"0.15em", fontWeight:700 }}>Employees in This Batch</div>
                </div>
                {batch.nominees.map((p, pi) => {
                  const eOpen = expandedE === p.id;
                  const t = clrTag(p.clearance_type);
                  return (
                    <div key={p.id} style={{ borderBottom:pi < batch.nominees.length-1 ? `1px solid ${C.line}` : "none" }}>
                      <div onClick={() => setExpandedE(eOpen ? null : p.id)}
                        style={{ display:"flex", gap:12, alignItems:"center", padding:"12px 18px", cursor:"pointer" }}
                        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = C.card2}
                        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:C.gold, flexShrink:0 }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{p.employee_name}</div>
                          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{lbl(p.stage) || "—"}</div>
                        </div>
                        <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                          <Pill t={t} />
                          {p.clearance_request_type && (
                            <span style={{ fontSize:10, fontWeight:600, color:C.muted,
                              background:"rgba(122,122,130,0.12)", border:`1px solid rgba(122,122,130,0.3)`,
                              padding:"2px 7px", borderRadius:3 }}>{p.clearance_request_type}</span>
                          )}
                          <span style={{ color:C.dim, fontSize:14, display:"inline-block",
                            transform:eOpen?"rotate(90deg)":"rotate(0deg)", transition:"transform 0.2s" }}>›</span>
                        </div>
                      </div>
                      {eOpen && (
                        <div style={{ background:C.side, borderTop:`1px solid ${C.line}`, padding:"14px 18px 16px 36px" }}>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 28px" }}>
                            {[
                              { label:"Email",           value:p.email || "—" },
                              { label:"Mobile",          value:p.mobile || "—" },
                              { label:"Clearance Level", value:p.clearance_type || "—" },
                              { label:"Request Type",    value:p.clearance_request_type || "New" },
                              { label:"Stage",           value:lbl(p.stage) || "—" },
                              { label:"Onboarding",      value:lbl(p.onboarding_status) || "—" },
                              { label:"Batch Date",      value:$d(p.batch_date) },
                              { label:"Linked Deal",     value:p.linked_deal_name || "—" },
                            ].map((row, ri) => (
                              <div key={ri}>
                                <div style={{ fontSize:9, color:C.gold, textTransform:"uppercase" as const,
                                  letterSpacing:"0.12em", fontWeight:700, marginBottom:2 }}>{row.label}</div>
                                <div style={{ fontSize:12, color:row.value==="—"?C.dim:C.text }}>{row.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );

  // ── PERSONNEL ────────────────────────────────────────────────────────────────
  const Personnel = () => (
    <div>
      <div style={{ marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:20, fontWeight:700, color:C.text }}>
          Personnel <span style={{ fontSize:14, color:C.muted, fontWeight:400 }}>({ppl.length})</span>
        </div>
        <button style={{ background:C.gold, border:"none", padding:"9px 18px", color:C.bg,
          fontWeight:700, fontSize:12, cursor:"pointer", borderRadius:4 }}>+ Nominate</button>
      </div>
      <Card>
        {ppl.length === 0 && <div style={{ padding:40, textAlign:"center" as const, color:C.dim }}>No personnel nominated.</div>}
        {ppl.map((p,i) => {
          const open = expandedP === p.id;
          const t = clrTag(p.clearance_type);
          return (
            <div key={p.id} style={{ borderBottom:i<ppl.length-1?`1px solid ${C.line}`:"none" }}>
              <div onClick={() => setExpandedP(open ? null : p.id)}
                style={{ display:"flex", gap:14, alignItems:"center", padding:"14px 18px", cursor:"pointer",
                  background:open?C.card2:"transparent" }}
                onMouseEnter={e => { if(!open)(e.currentTarget as HTMLDivElement).style.background = C.card2; }}
                onMouseLeave={e => { if(!open)(e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                <div style={{ width:8, height:8, borderRadius:"50%", flexShrink:0, background:C.gold }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{p.employee_name}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{lbl(p.stage) || "—"}</div>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                  <Pill t={t} />
                  {p.clearance_request_type && (
                    <span style={{ fontSize:10, fontWeight:600, color:C.muted,
                      background:"rgba(122,122,130,0.12)", border:`1px solid rgba(122,122,130,0.3)`,
                      padding:"2px 7px", borderRadius:3 }}>{p.clearance_request_type}</span>
                  )}
                  <span style={{ color:C.dim, fontSize:16, display:"inline-block",
                    transform:open?"rotate(90deg)":"rotate(0deg)", transition:"transform 0.2s" }}>›</span>
                </div>
              </div>
              {open && (
                <div style={{ background:C.card2, borderTop:`1px solid ${C.line}`, padding:"16px 18px 20px 40px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 32px" }}>
                    {[
                      { label:"Email",           value:p.email || "—" },
                      { label:"Mobile",          value:p.mobile || "—" },
                      { label:"Clearance Level", value:p.clearance_type || "—" },
                      { label:"Request Type",    value:p.clearance_request_type || "New" },
                      { label:"Stage",           value:lbl(p.stage) || "—" },
                      { label:"Onboarding",      value:lbl(p.onboarding_status) || "—" },
                      { label:"Batch Date",      value:$d(p.batch_date) },
                      { label:"Revalidation",    value:$d(p.revalidation_date) },
                      { label:"Linked Deal",     value:p.linked_deal_name || "—" },
                    ].map((row, ri) => (
                      <div key={ri}>
                        <div style={{ fontSize:10, color:C.gold, textTransform:"uppercase" as const,
                          letterSpacing:"0.12em", fontWeight:700, marginBottom:3 }}>{row.label}</div>
                        <div style={{ fontSize:13, color:row.value==="—"?C.dim:C.text }}>{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );

  // ── FINANCIALS ───────────────────────────────────────────────────────────────
  const Financials = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <Card top={C.gold}>
        <div style={{ padding:"20px 22px" }}>
          <div style={{ fontSize:11, color:C.gold, textTransform:"uppercase" as const, letterSpacing:"0.2em", marginBottom:4 }}>Total</div>
          <div style={{ fontSize:38, fontWeight:700, color:C.text }}>{$k(fees)}</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{co?.total_nominees||0} sponsored employees</div>
        </div>
      </Card>
      <Card>
        {[
          { label:"Application Fees",        value:co?.total_application_fees,  note:`${co?.total_nominees||0} × $400` },
          { label:"Year 1 Sponsorship",       value:co?.total_sponsorship_fees,  note:"$1,460 per employee" },
          { label:"AGSVA Pass-Through",       value:co?.total_agsva_fees,        note:"Government vetting at cost" },
          { label:"AusClear Fees (ex-AGSVA)", value:co?.total_fees_minus_agsva,  note:"App + Sponsorship" },
        ].map((row,i,arr) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"14px 18px", borderBottom:i<arr.length-1?`1px solid ${C.line}`:"none" }}>
            <div>
              <div style={{ fontSize:13, color:C.text }}>{row.label}</div>
              <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{row.note}</div>
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:C.gold, fontFamily:"monospace" }}>{$k(row.value)}</div>
          </div>
        ))}
      </Card>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, background:C.line }}>
        {[
          { label:"New",       value:co?.new_total??0,      col:C.green },
          { label:"Upgrades",  value:co?.upgrade_total??0,  col:C.amber },
          { label:"Transfers", value:co?.transfer_total??0, col:C.blue  },
        ].map((s,i) => (
          <div key={i} style={{ background:C.card, padding:"14px 16px" }}>
            <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase" as const, letterSpacing:"0.12em", marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:700, color:s.col }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── LOADING / ERROR ───────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" as const }}>
        <div style={{ width:32, height:32, border:`2px solid ${C.line}`, borderTopColor:C.gold,
          borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
        <p style={{ color:C.muted, fontSize:11, letterSpacing:"0.2em" }}>LOADING...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:C.card, border:`1px solid ${C.line}`, padding:32, textAlign:"center" as const }}>
        <p style={{ color:C.red, marginBottom:16 }}>{error}</p>
        <button onClick={() => window.location.reload()}
          style={{ background:C.gold, border:"none", padding:"10px 22px", color:C.bg, fontWeight:700, cursor:"pointer", borderRadius:4, marginRight:8 }}>
          Retry
        </button>
        <button onClick={() => router.push("/login")}
          style={{ background:"none", border:`1px solid ${C.line}`, padding:"10px 22px", color:C.muted, cursor:"pointer", borderRadius:4 }}>
          Login
        </button>
      </div>
    </div>
  );

  // ── TABS ──────────────────────────────────────────────────────────────────────
  const TABS = [
    { key:"overview"   as const, label:"Overview"   },
    { key:"batches"    as const, label:"Batches"    },
    { key:"personnel"  as const, label:"Personnel"  },
    { key:"financials" as const, label:"Financials" },
  ];

  // ── SHELL ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text,
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", display:"flex", flexDirection:"column" }}>

      {/* Top bar */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:"rgba(13,16,24,0.97)",
        backdropFilter:"blur(12px)", borderBottom:`1px solid ${C.line}`,
        height:56, padding:"0 20px", flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <img src="https://ausclear.au/AusClear-Dark-Transparent.png" alt="AusClear" style={{ height:32 }} />
          {!isMobile && <><div style={{ width:1, height:20, background:C.line }} />
          <span style={{ fontSize:13, color:C.muted, fontWeight:500 }}>{co?.company_name || "Corporate Portal"}</span>
          {co?.account_number && <span style={{ fontSize:11, color:C.dim, fontFamily:"monospace" }}>· {co.account_number}</span>}</>}
        </div>

        {/* Desktop: sign out */}
        {!isMobile && (
          <button onClick={() => router.push("/logout")} style={{ padding:"6px 16px",
            border:`1px solid ${C.line}`, background:"transparent",
            color:C.dim, fontSize:11, cursor:"pointer", borderRadius:4 }}>
            Sign Out
          </button>
        )}

        {/* Mobile: hamburger */}
        {isMobile && (
          <div style={{ position:"relative" }}>
            <button onClick={() => setMenuOpen(o=>!o)} style={{ background:"none",
              border:`1px solid ${C.line}`, padding:"6px 12px", color:C.muted, cursor:"pointer", fontSize:13 }}>☰</button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position:"fixed", inset:0, zIndex:49 }} />
                <div style={{ position:"absolute", right:0, top:38, background:C.card,
                  border:`1px solid ${C.line}`, zIndex:50, minWidth:180, boxShadow:"0 8px 24px rgba(0,0,0,0.6)" }}>
                  {TABS.map(t => (
                    <button key={t.key} onClick={() => { setTab(t.key); setMenuOpen(false); }}
                      style={{ display:"block", width:"100%", padding:"13px 18px", border:"none",
                        borderBottom:`1px solid ${C.line}`,
                        background:tab===t.key?"rgba(201,168,76,0.08)":"transparent",
                        color:tab===t.key?C.gold:C.text, fontSize:13, cursor:"pointer", textAlign:"left" as const }}>
                      {t.label}
                    </button>
                  ))}
                  <button onClick={() => router.push("/logout")} style={{ display:"block", width:"100%",
                    padding:"12px 18px", border:"none", background:"transparent",
                    color:C.muted, fontSize:12, cursor:"pointer", textAlign:"left" as const }}>Sign Out</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex:1, display:"flex", minHeight:0 }}>

        {/* Sidebar — desktop only */}
        {!isMobile && (
          <div style={{ width:220, flexShrink:0, background:C.side, borderRight:`1px solid ${C.line}`,
            position:"sticky", top:56, height:"calc(100vh - 56px)",
            display:"flex", flexDirection:"column", overflowY:"auto" }}>
            {/* Company info */}
            <div style={{ padding:"20px 18px 16px", borderBottom:`1px solid ${C.line}` }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4 }}>{co?.company_name || "—"}</div>
              <div style={{ fontSize:11, color:C.muted }}>ABN {co?.abn || "—"}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                Acct: <span style={{ color:C.gold, fontFamily:"monospace" }}>{co?.account_number || "—"}</span>
              </div>
              <div style={{ marginTop:10 }}>
                <span style={{ fontSize:10, fontWeight:700, color:C.green,
                  background:"rgba(92,184,122,0.12)", border:"1px solid rgba(92,184,122,0.3)",
                  padding:"3px 10px", borderRadius:3 }}>Active</span>
              </div>
            </div>
            {/* Stats */}
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.line}` }}>
              {[
                { label:"Nominees",  value:co?.total_nominees??0, col:C.text  },
                { label:"Total Fees",value:$k(fees),              col:C.gold  },
                { label:"Baseline",  value:co?.baseline_total??0, col:C.muted },
                { label:"NV1",       value:co?.nv1_total??0,      col:C.blue  },
                { label:"NV2",       value:co?.nv2_total??0,      col:C.gold  },
                { label:"New",       value:co?.new_total??0,      col:C.green },
              ].map((s,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ fontSize:11, color:C.muted }}>{s.label}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:s.col }}>{s.value}</div>
                </div>
              ))}
            </div>
            {/* Nav */}
            <nav style={{ padding:"8px 0", flex:1 }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ display:"block", width:"100%", padding:"11px 18px", border:"none",
                    borderLeft:tab===t.key?`3px solid ${C.gold}`:"3px solid transparent",
                    background:tab===t.key?"rgba(201,168,76,0.06)":"transparent",
                    color:tab===t.key?C.gold:C.muted,
                    fontSize:13, fontWeight:tab===t.key?600:400,
                    cursor:"pointer", textAlign:"left" as const }}>
                  {t.label}
                </button>
              ))}
            </nav>
            {/* Footer */}
            <div style={{ padding:"14px 18px", borderTop:`1px solid ${C.line}` }}>
              <div style={{ fontSize:10, color:C.dim }}>AUSCLEAR CORPORATE PORTAL</div>
              <div style={{ fontSize:10, color:C.dim, marginTop:3 }}>support@ausclear.com.au</div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div style={{ flex:1, overflowY:"auto", minWidth:0 }}>
          <main style={{ padding:isMobile?"16px 16px 60px":"24px 28px 60px" }}>
            {tab==="overview"   && <Overview />}
            {tab==="batches"    && <Batches />}
            {tab==="personnel"  && <Personnel />}
            {tab==="financials" && <Financials />}
          </main>
        </div>
      </div>
    </div>
  );
}
