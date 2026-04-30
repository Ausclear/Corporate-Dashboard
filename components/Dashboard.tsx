"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────
type Co = {
  company_name: string; abn: string; client_ref: string;
  email: string; phone: string;
  total_nominees: number; new_total: number; upgrade_total: number; transfer_total: number;
  baseline_total: number; nv1_total: number; nv2_total: number;
  total_agsva_fees: number; total_application_fees: number;
  total_sponsorship_fees: number; total_fees_minus_agsva: number; overall_progress: number;
};
type P = {
  id: string; employee_name: string; first_name: string; last_name: string;
  email: string; mobile: string; clearance_type: string; clearance_request_type: string;
  stage: string; status: string; batch_date: string | null;
  onboarding_status?: string | null; revalidation_date?: string | null;
  linked_deal_name?: string | null;
};
type A = { id: string; event: string; event_date: string };
type Data = { company: Co; personnel: P[]; activity: A[]; user: { email: string } };

// ── Corporate pipeline stages ────────────────────────────────────────────────
const CORP_STAGES = [
  { key: "Onboard Corporate Account", label: "Onboarding",       short: "Onboarding" },
  { key: "Prepare Contract",          label: "Prepare Contract", short: "Contract"   },
  { key: "Contract Sent",             label: "Contract Sent",    short: "Sent"       },
  { key: "Contracts Signed",          label: "Contracts Signed", short: "Signed"     },
  { key: "Active",                    label: "Active",           short: "Active"     },
];

// Real deals from Zoho
const CORP_DEALS = [
  { id: "1", name: "Clearance FIRST",  stage: "Onboard Corporate Account", amount: 2886,  date: "3 Apr 2026" },
  { id: "2", name: "Adept CONTRACTS",  stage: "Prepare Contract",           amount: 3215,  date: "4 Apr 2026" },
  { id: "3", name: "NETFLIX",          stage: "Onboard Corporate Account",  amount: 5488,  date: "18 Apr 2026" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const $k = (n?: number | null) => n != null ? `$${Number(n).toLocaleString("en-AU")}` : "—";
const $d = (s?: string | null) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return s; }
};
const clr = (c: string) =>
  c?.includes("NV2") ? { label:"NV2", col:"#c9a84c", bg:"rgba(201,168,76,0.15)", border:"rgba(201,168,76,0.4)" } :
  c?.includes("NV1") ? { label:"NV1", col:"#6b9fd4", bg:"rgba(107,159,212,0.15)", border:"rgba(107,159,212,0.4)" } :
                       { label:"BSL", col:"#7a7a82", bg:"rgba(122,122,130,0.15)", border:"rgba(122,122,130,0.4)" };

const STAGE_COLOURS = ["#2563a8","#1e7fcb","#1799d4","#12a882","#0f9e6a"];

function Tag({ t }: { t: ReturnType<typeof clr> }) {
  return <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase" as const,
    color:t.col, background:t.bg, border:`1px solid ${t.border}`, padding:"2px 8px", borderRadius:3 }}>{t.label}</span>;
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab]       = useState<"overview"|"pipeline"|"personnel"|"financials">("overview");
  const [data, setData]     = useState<Data|null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [expanded, setExpanded] = useState<string|null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/dashboard/data").then(r=>r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const co  = data?.company;
  const ppl = data?.personnel || [];
  const act = data?.activity  || [];
  const fees = co ? co.total_agsva_fees + co.total_application_fees + co.total_sponsorship_fees : 0;

  // ── CHEVRON PIPELINE ────────────────────────────────────────────────────────
  const Pipeline = () => {
    const [sel, setSel] = useState<string|null>(null);
    const dealsForStage = (key: string) => CORP_DEALS.filter(d => d.stage === key);

    return (
      <div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:"#c9a84c", textTransform:"uppercase" as const, letterSpacing:"0.2em", marginBottom:4 }}>Corporate Accounts</div>
          <h2 style={{ fontSize:22, fontWeight:700, color:"#e8e5de", margin:0 }}>Pipeline — {CORP_DEALS.length} accounts</h2>
        </div>

        {/* Chevron pipeline */}
        <div style={{ overflowX:"auto", paddingBottom:8, marginBottom:20 }}>
          <div style={{ display:"flex", minWidth:680, position:"relative" }}>
            {CORP_STAGES.map((stage, si) => {
              const deals = dealsForStage(stage.key);
              const isActive = deals.length > 0;
              const isSelected = sel === stage.key;
              const colour = STAGE_COLOURS[si];
              const isLast = si === CORP_STAGES.length - 1;
              const chevronW = 140;
              const gap = 2;

              return (
                <div key={stage.key} onClick={() => setSel(isSelected ? null : stage.key)}
                  style={{ position:"relative", cursor:"pointer", marginRight: isLast ? 0 : -20,
                    flex:1, minWidth:chevronW }}>
                  {/* Chevron shape via CSS */}
                  <div style={{
                    position:"relative",
                    background: isActive ? colour : "#1a1f2e",
                    border: isSelected ? `2px solid #fff` : "none",
                    opacity: isActive ? 1 : 0.4,
                    padding:"14px 28px 14px 24px",
                    // chevron: right side points right, left side has notch (except first)
                    clipPath: si === 0
                      ? "polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%)"
                      : "polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%, 20px 50%)",
                    transition:"opacity 0.2s",
                    zIndex: CORP_STAGES.length - si,
                  }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const,
                      letterSpacing:"0.12em", color:"rgba(255,255,255,0.8)", marginBottom:4 }}>
                      {stage.short}
                    </div>
                    <div style={{ fontSize:28, fontWeight:700, color:"#fff", lineHeight:1 }}>
                      {deals.length}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected stage deals */}
        {sel && (() => {
          const deals = dealsForStage(sel);
          const stageIdx = CORP_STAGES.findIndex(s => s.key === sel);
          const colour = STAGE_COLOURS[stageIdx];
          return (
            <div style={{ background:"#111318", border:`1px solid #252b38`, borderTop:`3px solid ${colour}`, marginBottom:16 }}>
              <div style={{ padding:"12px 18px", borderBottom:"1px solid #252b38" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#e8e5de" }}>
                  {CORP_STAGES.find(s=>s.key===sel)?.label} — {deals.length} account{deals.length!==1?"s":""}
                </div>
              </div>
              {deals.length === 0
                ? <div style={{ padding:"24px 18px", color:"#4a4a52", fontSize:13 }}>No accounts at this stage.</div>
                : deals.map((d,i) => (
                <div key={d.id} style={{ padding:"14px 18px", borderBottom:i<deals.length-1?"1px solid #252b38":"none",
                  display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:"#e8e5de", marginBottom:3 }}>{d.name}</div>
                    <div style={{ fontSize:11, color:"#7a7a82" }}>{d.date}</div>
                  </div>
                  <div style={{ fontSize:16, fontWeight:700, color:"#c9a84c", fontFamily:"monospace" }}>{$k(d.amount)}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* All accounts list */}
        <div style={{ background:"#111318", border:"1px solid #252b38" }}>
          <div style={{ padding:"12px 18px", borderBottom:"1px solid #252b38" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#e8e5de" }}>All Accounts</div>
          </div>
          {CORP_DEALS.map((d,i) => {
            const stageIdx = CORP_STAGES.findIndex(s=>s.key===d.stage);
            const colour = stageIdx>=0 ? STAGE_COLOURS[stageIdx] : "#666";
            return (
              <div key={d.id} style={{ display:"flex", gap:14, alignItems:"center", padding:"14px 18px",
                borderBottom:i<CORP_DEALS.length-1?"1px solid #252b38":"none" }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:colour, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#e8e5de" }}>{d.name}</div>
                  <div style={{ fontSize:11, color:"#7a7a82", marginTop:2 }}>{CORP_STAGES.find(s=>s.key===d.stage)?.label}</div>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:"#c9a84c", fontFamily:"monospace" }}>{$k(d.amount)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── OVERVIEW ─────────────────────────────────────────────────────────────
  const Overview = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* Header */}
      <div style={{ background:"#111318", border:"1px solid #252b38", borderTop:"2px solid #c9a84c", padding:"18px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:"#e8e5de", margin:"0 0 5px" }}>{co?.company_name||"—"}</h1>
            <div style={{ fontSize:12, color:"#7a7a82" }}>
              {co?.abn && <span>ABN {co.abn} &nbsp;·&nbsp; </span>}
              Account: <span style={{ color:"#c9a84c", fontFamily:"monospace", fontWeight:700 }}>{co?.client_ref||"—"}</span>
            </div>
          </div>
          <span style={{ fontSize:11, fontWeight:700, color:"#5cb87a", background:"rgba(92,184,122,0.12)",
            border:"1px solid rgba(92,184,122,0.35)", padding:"4px 12px", borderRadius:4 }}>Active</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:1, background:"#252b38" }}>
        {[
          { label:"Nominees",    value:co?.total_nominees??0,  col:"#e8e5de" },
          { label:"Total Fees",  value:$k(fees),               col:"#c9a84c" },
          { label:"NV1",         value:co?.nv1_total??0,        col:"#6b9fd4" },
          { label:"NV2",         value:co?.nv2_total??0,        col:"#c9a84c" },
        ].map((s,i) => (
          <div key={i} style={{ background:"#111318", padding:"16px 18px" }}>
            <div style={{ fontSize:10, color:"#7a7a82", textTransform:"uppercase" as const, letterSpacing:"0.14em", marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:700, color:s.col, lineHeight:1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Pipeline preview */}
      <div style={{ background:"#111318", border:"1px solid #252b38" }}>
        <div style={{ padding:"12px 18px", borderBottom:"1px solid #252b38", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:13, fontWeight:600, color:"#e8e5de" }}>Corporate Pipeline</span>
          <button onClick={() => setTab("pipeline")} style={{ fontSize:11, color:"#c9a84c", background:"none", border:"none", cursor:"pointer", padding:0 }}>View full pipeline →</button>
        </div>
        <div style={{ overflowX:"auto", padding:"14px 18px" }}>
          <div style={{ display:"flex", minWidth:500 }}>
            {CORP_STAGES.map((stage,si) => {
              const count = CORP_DEALS.filter(d=>d.stage===stage.key).length;
              const isLast = si===CORP_STAGES.length-1;
              return (
                <div key={stage.key} onClick={() => setTab("pipeline")}
                  style={{ flex:1, marginRight:isLast?0:-16, position:"relative", cursor:"pointer",
                    clipPath: si===0
                      ? "polygon(0 0,calc(100% - 16px) 0,100% 50%,calc(100% - 16px) 100%,0 100%)"
                      : "polygon(0 0,calc(100% - 16px) 0,100% 50%,calc(100% - 16px) 100%,0 100%,16px 50%)",
                    background: count>0 ? STAGE_COLOURS[si] : "#1a1f2e",
                    opacity: count>0 ? 1 : 0.35,
                    padding:"10px 22px 10px 18px",
                    zIndex: CORP_STAGES.length - si,
                  }}>
                  <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.1em", color:"rgba(255,255,255,0.75)" }}>{stage.short}</div>
                  <div style={{ fontSize:20, fontWeight:700, color:"#fff" }}>{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Personnel preview */}
      <div style={{ background:"#111318", border:"1px solid #252b38" }}>
        <div style={{ padding:"12px 18px", borderBottom:"1px solid #252b38", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:13, fontWeight:600, color:"#e8e5de" }}>Personnel ({ppl.length})</span>
          <button onClick={() => setTab("personnel")} style={{ fontSize:11, color:"#c9a84c", background:"none", border:"none", cursor:"pointer", padding:0 }}>View all →</button>
        </div>
        {ppl.slice(0,4).map((p,i) => {
          const t = clr(p.clearance_type);
          return (
            <div key={p.id} style={{ display:"flex", gap:12, alignItems:"center", padding:"12px 18px",
              borderBottom:i<Math.min(3,ppl.length-1)?"1px solid #252b38":"none" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500, color:"#e8e5de" }}>{p.employee_name}</div>
                <div style={{ fontSize:11, color:"#7a7a82", marginTop:2 }}>{p.stage||"—"}</div>
              </div>
              <Tag t={t} />
            </div>
          );
        })}
      </div>

      {act.length>0 && (
        <div style={{ background:"#111318", border:"1px solid #252b38" }}>
          <div style={{ padding:"12px 18px", borderBottom:"1px solid #252b38" }}>
            <span style={{ fontSize:13, fontWeight:600, color:"#e8e5de" }}>Recent Activity</span>
          </div>
          {act.slice(0,5).map((a,i) => (
            <div key={a.id} style={{ display:"flex", gap:12, padding:"10px 18px",
              borderBottom:i<4?"1px solid #252b38":"none", alignItems:"flex-start" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#c9a84c", flexShrink:0, marginTop:5 }} />
              <div style={{ flex:1, fontSize:12, color:"#e8e5de" }}>{a.event}</div>
              <div style={{ fontSize:11, color:"#4a4a52", whiteSpace:"nowrap" as const }}>{$d(a.event_date)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── PERSONNEL ─────────────────────────────────────────────────────────────
  const Personnel = () => (
    <div>
      <div style={{ marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h2 style={{ fontSize:20, fontWeight:700, color:"#e8e5de", margin:0 }}>
          Personnel <span style={{ fontSize:14, color:"#7a7a82", fontWeight:400 }}>({ppl.length})</span>
        </h2>
        <button style={{ background:"#c9a84c", border:"none", padding:"9px 18px", color:"#07070a",
          fontWeight:700, fontSize:12, cursor:"pointer", borderRadius:4 }}>+ Nominate</button>
      </div>
      <div style={{ background:"#111318", border:"1px solid #252b38" }}>
        {ppl.length===0 && <div style={{ padding:40, textAlign:"center" as const, color:"#4a4a52" }}>No personnel nominated.</div>}
        {ppl.map((p,i) => {
          const open = expanded===p.id;
          const t = clr(p.clearance_type);
          return (
            <div key={p.id} style={{ borderBottom:i<ppl.length-1?"1px solid #252b38":"none" }}>
              {/* Row */}
              <div onClick={() => setExpanded(open?null:p.id)}
                style={{ display:"flex", gap:14, alignItems:"center", padding:"14px 18px", cursor:"pointer",
                  background:open?"#191c24":"transparent" }}
                onMouseEnter={e => { if(!open)(e.currentTarget as HTMLDivElement).style.background="#191c24"; }}
                onMouseLeave={e => { if(!open)(e.currentTarget as HTMLDivElement).style.background="transparent"; }}>
                {/* Stage dot */}
                <div style={{ width:8, height:8, borderRadius:"50%", flexShrink:0,
                  background: p.stage?.toLowerCase().includes("granted")||p.stage?.toLowerCase().includes("complete") ? "#5cb87a" : "#c9a84c" }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"#e8e5de" }}>{p.employee_name}</div>
                  <div style={{ fontSize:11, color:"#7a7a82", marginTop:2 }}>{p.stage||"—"}</div>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                  <Tag t={t} />
                  {p.clearance_request_type && (
                    <span style={{ fontSize:10, fontWeight:600, color:"#7a7a82",
                      background:"rgba(122,122,130,0.12)", border:"1px solid rgba(122,122,130,0.3)",
                      padding:"2px 7px", borderRadius:3 }}>{p.clearance_request_type}</span>
                  )}
                  <span style={{ color:"#4a4a52", fontSize:16,
                    display:"inline-block", transform:open?"rotate(90deg)":"rotate(0)",
                    transition:"transform 0.2s" }}>›</span>
                </div>
              </div>

              {/* Expanded info — inline */}
              {open && (
                <div style={{ background:"#191c24", borderTop:"1px solid #252b38", padding:"16px 18px 20px 40px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 32px" }}>
                    {[
                      { label:"Email",            value:p.email||"—" },
                      { label:"Mobile",           value:p.mobile||"—" },
                      { label:"Clearance Level",  value:p.clearance_type||"—" },
                      { label:"Request Type",     value:p.clearance_request_type||"New" },
                      { label:"Stage",            value:p.stage||"—" },
                      { label:"Onboarding",       value:p.onboarding_status||"—" },
                      { label:"Batch Date",       value:$d(p.batch_date) },
                      { label:"Revalidation",     value:$d(p.revalidation_date||null) },
                      { label:"Linked Deal",      value:p.linked_deal_name||"—" },
                    ].map((row,ri) => (
                      <div key={ri}>
                        <div style={{ fontSize:10, color:"#c9a84c", textTransform:"uppercase" as const,
                          letterSpacing:"0.12em", fontWeight:700, marginBottom:3 }}>{row.label}</div>
                        <div style={{ fontSize:13, color:row.value==="—"?"#4a4a52":"#e8e5de" }}>{row.value}</div>
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
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ background:"#111318", border:"1px solid #252b38", borderTop:"2px solid #c9a84c", padding:"20px 22px" }}>
        <div style={{ fontSize:11, color:"#c9a84c", textTransform:"uppercase" as const, letterSpacing:"0.2em", marginBottom:4 }}>Total</div>
        <div style={{ fontSize:40, fontWeight:700, color:"#e8e5de" }}>{$k(fees)}</div>
        <div style={{ fontSize:12, color:"#7a7a82", marginTop:4 }}>{co?.total_nominees||0} sponsored employees</div>
      </div>
      <div style={{ background:"#111318", border:"1px solid #252b38" }}>
        {[
          { label:"Application Fees",         value:co?.total_application_fees,  note:`${co?.total_nominees||0} × $400` },
          { label:"Year 1 Sponsorship",        value:co?.total_sponsorship_fees,  note:"$1,460 per employee" },
          { label:"AGSVA Pass-Through",        value:co?.total_agsva_fees,        note:"Government cost" },
          { label:"AusClear Fees (ex-AGSVA)",  value:co?.total_fees_minus_agsva,  note:"App + Sponsorship" },
        ].map((row,i,arr) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"14px 18px", borderBottom:i<arr.length-1?"1px solid #252b38":"none" }}>
            <div>
              <div style={{ fontSize:13, color:"#e8e5de" }}>{row.label}</div>
              <div style={{ fontSize:11, color:"#4a4a52", marginTop:2 }}>{row.note}</div>
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:"#c9a84c", fontFamily:"monospace" }}>{$k(row.value)}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, background:"#252b38" }}>
        {[
          { label:"New",      value:co?.new_total??0,      col:"#5cb87a" },
          { label:"Upgrades", value:co?.upgrade_total??0,  col:"#d4935c" },
          { label:"Transfers",value:co?.transfer_total??0, col:"#6b9fd4" },
        ].map((s,i) => (
          <div key={i} style={{ background:"#111318", padding:"14px 16px" }}>
            <div style={{ fontSize:10, color:"#7a7a82", textTransform:"uppercase" as const, letterSpacing:"0.12em", marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:700, color:s.col }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── LOADING / ERROR ───────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#07070a", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" as const }}>
        <div style={{ width:32, height:32, border:"2px solid #252b38", borderTopColor:"#c9a84c",
          borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
        <p style={{ color:"#7a7a82", fontSize:11, letterSpacing:"0.2em" }}>LOADING...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:"100vh", background:"#07070a", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#111318", border:"1px solid #252b38", padding:32, textAlign:"center" as const, borderRadius:8 }}>
        <p style={{ color:"#c97a7a", marginBottom:16 }}>{error}</p>
        <button onClick={() => router.push("/login")} style={{ background:"#c9a84c", border:"none", padding:"10px 22px",
          color:"#07070a", fontWeight:700, cursor:"pointer", borderRadius:4 }}>Back to Login</button>
      </div>
    </div>
  );

  // ── SHELL ─────────────────────────────────────────────────────────────────
  const TABS = [
    { key:"overview",   label:"Overview"   },
    { key:"pipeline",   label:"Pipeline"   },
    { key:"personnel",  label:"Personnel"  },
    { key:"financials", label:"Financials" },
  ] as const;

  return (
    <div style={{ minHeight:"100vh", background:"#07070a", color:"#e8e5de",
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* Topbar */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:"rgba(17,19,24,0.95)",
        backdropFilter:"blur(12px)", borderBottom:"1px solid #252b38",
        padding:"0 20px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <img src="https://ausclear.au/AusClear-Light-Transparent.png" alt="AusClear" style={{ height:22 }} />
          <div style={{ width:1, height:18, background:"#252b38" }} />
          <span style={{ fontSize:12, color:"#7a7a82" }}>{co?.company_name||"Corporate Portal"}</span>
        </div>
        <div style={{ position:"relative" }}>
          <button onClick={() => setMenuOpen(o=>!o)} style={{ background:"none", border:"1px solid #252b38",
            padding:"6px 12px", color:"#7a7a82", cursor:"pointer", fontSize:13 }}>☰</button>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position:"fixed", inset:0, zIndex:49 }} />
              <div style={{ position:"absolute", right:0, top:36, background:"#111318",
                border:"1px solid #252b38", zIndex:50, minWidth:160, boxShadow:"0 8px 24px rgba(0,0,0,0.6)" }}>
                {TABS.map(t => (
                  <button key={t.key} onClick={() => { setTab(t.key); setMenuOpen(false); }}
                    style={{ display:"block", width:"100%", padding:"11px 18px", border:"none",
                      borderBottom:"1px solid #252b38", background:tab===t.key?"rgba(201,168,76,0.08)":"transparent",
                      color:tab===t.key?"#c9a84c":"#e8e5de", fontSize:13, cursor:"pointer", textAlign:"left" as const }}>
                    {t.label}
                  </button>
                ))}
                <button onClick={() => router.push("/logout")} style={{ display:"block", width:"100%",
                  padding:"11px 18px", border:"none", background:"transparent", color:"#7a7a82",
                  fontSize:12, cursor:"pointer", textAlign:"left" as const }}>Sign Out</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom:"1px solid #252b38", padding:"0 20px", display:"flex", overflowX:"auto" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:"13px 18px", border:"none",
              borderBottom:tab===t.key?"2px solid #c9a84c":"2px solid transparent",
              background:"transparent", color:tab===t.key?"#c9a84c":"#7a7a82",
              fontSize:13, fontWeight:tab===t.key?600:400, cursor:"pointer", whiteSpace:"nowrap" as const }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main style={{ maxWidth:960, margin:"0 auto", padding:"20px 20px 60px" }}>
        {tab==="overview"   && <Overview />}
        {tab==="pipeline"   && <Pipeline />}
        {tab==="personnel"  && <Personnel />}
        {tab==="financials" && <Financials />}
      </main>
    </div>
  );
}
