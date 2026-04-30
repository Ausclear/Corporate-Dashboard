"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const G = "#c9a84c", GD = "rgba(201,168,76,0.12)", GB = "rgba(201,168,76,0.3)";
const BG = "#07070a", CARD = "#202028", INPUT = "#16161c";
const TEXT = "rgba(255,255,255,0.95)", TEXT2 = "#9a9898", MUTED = "#6b6969";
const BORDER = "rgba(255,255,255,0.06)";
const GREEN = "#34d399", GNB = "rgba(5,150,105,0.3)", GND = "rgba(5,150,105,0.15)";
const AMBER = "#fbbf24", AMD = "rgba(245,158,11,0.15)", AMB = "rgba(245,158,11,0.3)";
const RED = "#f87171", RDD = "rgba(220,38,38,0.15)", RDB = "rgba(220,38,38,0.3)";
const BLUE = "#93c5fd", BLD = "rgba(147,197,253,0.12)";

const fmtMoney = (n: number | null | undefined) =>
  n != null ? `$${Number(n).toLocaleString("en-AU", { minimumFractionDigits: 2 })}` : "—";

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-AU", { day:"2-digit", month:"short", year:"numeric" }); }
  catch { return d; }
};

const clrLabel = (c: string) => c?.includes("NV2") ? "NV2" : c?.includes("NV1") ? "NV1" : "BL";
const clrColour = (c: string) => c?.includes("NV2") ? G : c?.includes("NV1") ? BLUE : TEXT2;
const clrBg = (c: string) => c?.includes("NV2") ? GD : c?.includes("NV1") ? BLD : "rgba(255,255,255,0.06)";
const clrBorder = (c: string) => c?.includes("NV2") ? GB : c?.includes("NV1") ? "rgba(147,197,253,0.3)" : "rgba(255,255,255,0.12)";

const NAV = ["Dashboard","Personnel","Financials","Activity","Support"];

type Co = {
  company_name:string; abn:string; client_ref:string; status:string; tier:string|null;
  contract_start:string|null; contract_expiry:string|null; monthly_spend:string;
  email:string; phone:string; books_customer_number:string;
  total_nominees:number; new_total:number; upgrade_total:number; transfer_total:number;
  baseline_total:number; nv1_total:number; nv2_total:number;
  total_agsva_fees:number; total_application_fees:number;
  total_sponsorship_fees:number; total_fees_minus_agsva:number; overall_progress:number;
};
type P = {
  id:string; employee_name:string; first_name:string; last_name:string;
  email:string; mobile:string; clearance_type:string; clearance_request_type:string;
  stage:string; status:string; batch_date:string|null; onboarding_status:string|null;
  employee_number:number|null; linked_deal_name:string|null; revalidation_date:string|null;
};
type A = { id:string; employee_name:string; event:string; event_type:string; event_date:string; };
type Data = { company:Co; personnel:P[]; activity:A[]; user:{ email:string; display_name:string; role:string } };

function Badge({ text, colour, bg, border }: { text:string; colour:string; bg:string; border:string }) {
  return <span style={{ display:"inline-block", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", color:colour, background:bg, border:`1px solid ${border}`, padding:"3px 10px", borderRadius:20, whiteSpace:"nowrap" }}>{text}</span>;
}

function GoldCheck() {
  return (
    <div style={{ width:18, height:18, borderRadius:4, background:GD, border:`1px solid ${GB}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke={G} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  );
}

export default function Dashboard() {
  const [page, setPage] = useState("Dashboard");
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

  // ── PERSONNEL DRAWER ──────────────────────────────────────────────────────
  const Drawer = () => {
    if (!selectedP) return null;
    const p = selectedP;
    return (
      <>
        <div onClick={() => setSelectedP(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:200, backdropFilter:"blur(6px)" }} />
        <div style={{ position:"fixed", top:0, right:0, bottom:0, width:isMobile?"100%":400, background:CARD, zIndex:201, borderLeft:`1px solid ${BORDER}`, overflowY:"auto", display:"flex", flexDirection:"column" }}>
          <div style={{ height:3, background:`linear-gradient(90deg,${G},transparent)` }} />
          <div style={{ padding:"20px 24px 16px", borderBottom:`1px solid ${BORDER}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:17, fontFamily:"Georgia,serif", color:TEXT, fontWeight:700, marginBottom:8 }}>{p.employee_name}</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <Badge text={clrLabel(p.clearance_type)} colour={clrColour(p.clearance_type)} bg={clrBg(p.clearance_type)} border={clrBorder(p.clearance_type)} />
                <Badge text={p.clearance_request_type||"New"} colour={G} bg={GD} border={GB} />
              </div>
            </div>
            <button onClick={() => setSelectedP(null)} style={{ background:"none", border:"none", cursor:"pointer", color:TEXT2, fontSize:20, padding:4 }}>✕</button>
          </div>
          <div style={{ padding:24, flex:1 }}>
            {[
              { label:"Email", value:p.email||"—" },
              { label:"Mobile", value:p.mobile||"—" },
              { label:"Clearance Level", value:p.clearance_type||"—" },
              { label:"Request Type", value:p.clearance_request_type||"New" },
              { label:"Current Stage", value:p.stage||"—" },
              { label:"Onboarding Status", value:p.onboarding_status||"—" },
              { label:"Batch Date", value:fmtDate(p.batch_date) },
              { label:"Revalidation Due", value:fmtDate(p.revalidation_date) },
              { label:"Linked Deal", value:p.linked_deal_name||"—" },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom:18, paddingBottom:18, borderBottom:i<8?`1px solid ${BORDER}`:"none" }}>
                <div style={{ fontSize:10, color:G, textTransform:"uppercase", letterSpacing:"1.5px", fontWeight:700, marginBottom:4 }}>{item.label}</div>
                <div style={{ fontSize:13, color:item.value==="—"?MUTED:TEXT }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={{ padding:"16px 24px 24px", borderTop:`1px solid ${BORDER}` }}>
            <p style={{ fontSize:11, color:MUTED, margin:"0 0 4px" }}>Questions about this employee?</p>
            <p style={{ fontSize:12, color:TEXT2, margin:0 }}>
              <span style={{ color:G }}>1300 027 423</span> · support@ausclear.com.au
            </p>
          </div>
        </div>
        <style>{`@keyframes slideIn { from { transform:translateX(100%); } to { transform:translateX(0); } }`}</style>
      </>
    );
  };

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* Company header card */}
      <div style={{ background:CARD, borderRadius:16, border:`1px solid ${GB}`, overflow:"hidden", position:"relative" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,${G},rgba(201,168,76,0.3),transparent)` }} />
        <div style={{ padding:isMobile?"18px 16px":"22px 24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10, marginBottom:12 }}>
            <div>
              <div style={{ fontFamily:"Georgia,serif", fontSize:isMobile?18:22, color:TEXT, fontWeight:700 }}>{co?.company_name||"—"}</div>
              <div style={{ fontSize:11, color:TEXT2, marginTop:5 }}>
                {co?.abn && <span>ABN {co.abn} · </span>}
                Ref: <span style={{ color:G, fontFamily:"monospace", fontWeight:700 }}>{co?.client_ref||"—"}</span>
                {co?.books_customer_number && <span style={{ color:TEXT2 }}> · No. {co.books_customer_number}</span>}
              </div>
            </div>
            <Badge text="Active" colour={GREEN} bg={GND} border={GNB} />
          </div>
          <div style={{ paddingTop:12, borderTop:`1px solid ${BORDER}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:10, color:MUTED, textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:3 }}>Total Fees</div>
              <div style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:G }}>{fmtMoney(totalFees)}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:MUTED, textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:3 }}>Nominees</div>
              <div style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:TEXT }}>{co?.total_nominees||0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        {[
          { label:"Baseline", value:co?.baseline_total??0, col:TEXT2, bg:"rgba(255,255,255,0.06)", border:"rgba(255,255,255,0.1)" },
          { label:"NV1", value:co?.nv1_total??0, col:BLUE, bg:BLD, border:"rgba(147,197,253,0.25)" },
          { label:"NV2", value:co?.nv2_total??0, col:G, bg:GD, border:GB },
        ].map((s,i) => (
          <div key={i} style={{ background:CARD, borderRadius:12, border:`1px solid ${s.border}`, overflow:"hidden" }}>
            <div style={{ height:2, background:s.col }} />
            <div style={{ padding:"12px 14px" }}>
              <div style={{ fontFamily:"Georgia,serif", fontSize:26, fontWeight:700, color:TEXT, lineHeight:1.1 }}>{s.value}</div>
              <div style={{ fontSize:10, color:TEXT2, marginTop:3, textTransform:"uppercase", letterSpacing:"1.5px" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Personnel register */}
      <div style={{ background:CARD, borderRadius:16, border:`1px solid ${GB}`, overflow:"hidden" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,${G},transparent)` }} />
        <div style={{ padding:"16px 20px 12px", borderBottom:`1px solid ${BORDER}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:15, color:TEXT, fontWeight:700 }}>
            Nominated Personnel <span style={{ fontSize:12, color:MUTED, fontFamily:"inherit" }}>({personnel.length})</span>
          </div>
          <button onClick={() => setPage("Personnel")} style={{ fontSize:11, color:G, background:GD, border:`1px solid ${GB}`, borderRadius:8, padding:"6px 12px", cursor:"pointer", fontWeight:700, fontFamily:"inherit" }}>View All</button>
        </div>
        <div>
          {personnel.length === 0 && <div style={{ padding:32, textAlign:"center", color:MUTED, fontSize:13 }}>No personnel nominated yet.</div>}
          {personnel.slice(0,5).map((p,i) => (
            <div key={p.id} onClick={() => setSelectedP(p)}
              style={{ display:"flex", gap:12, alignItems:"center", padding:"14px 20px", borderBottom:i<Math.min(personnel.length,5)-1?`1px solid ${BORDER}`:"none", cursor:"pointer" }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}>
              {/* Stage indicator */}
              <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                background: p.stage?.toLowerCase().includes("granted") ? "#059669" : p.status==="pending" ? G : "rgba(255,255,255,0.1)",
                border: p.stage?.toLowerCase().includes("granted") ? "2px solid #059669" : p.status==="pending" ? `2px solid ${G}` : "2px solid rgba(255,255,255,0.15)" }}>
                {p.stage?.toLowerCase().includes("granted") ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : p.status==="pending" ? (
                  <div style={{ width:6, height:6, borderRadius:"50%", background:BG }} />
                ) : (
                  <div style={{ width:6, height:6, borderRadius:"50%", background:"rgba(255,255,255,0.4)" }} />
                )}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color:TEXT, fontWeight:600, marginBottom:2 }}>{p.employee_name}</div>
                <div style={{ fontSize:11, color:TEXT2 }}>{p.stage||"—"}</div>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                <Badge text={clrLabel(p.clearance_type)} colour={clrColour(p.clearance_type)} bg={clrBg(p.clearance_type)} border={clrBorder(p.clearance_type)} />
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity:0.2 }}><polyline points="4,3 9,7 4,11" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fee summary card */}
      <div style={{ background:CARD, borderRadius:16, border:`1px solid ${BORDER}`, overflow:"hidden" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,${G},transparent)` }} />
        <div style={{ padding:"16px 20px 12px", borderBottom:`1px solid ${BORDER}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:15, color:TEXT, fontWeight:700 }}>Fee Summary</div>
          <button onClick={() => setPage("Financials")} style={{ fontSize:11, color:G, background:GD, border:`1px solid ${GB}`, borderRadius:8, padding:"6px 12px", cursor:"pointer", fontWeight:700, fontFamily:"inherit" }}>Details</button>
        </div>
        {[
          { label:"Application Fees", value:co?.total_application_fees },
          { label:"Sponsorship Fees", value:co?.total_sponsorship_fees },
          { label:"AGSVA Fees", value:co?.total_agsva_fees },
        ].map((row,i,arr) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 20px", borderBottom:i<arr.length-1?`1px solid ${BORDER}`:"none" }}>
            <div style={{ fontSize:13, color:TEXT2 }}>{row.label}</div>
            <div style={{ fontSize:14, fontWeight:700, color:G, fontFamily:"monospace" }}>{fmtMoney(row.value)}</div>
          </div>
        ))}
        <div style={{ padding:"13px 20px", background:"rgba(201,168,76,0.04)", borderTop:`1px solid ${GB}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:13, fontWeight:700, color:TEXT }}>Total</div>
          <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:G }}>{fmtMoney(totalFees)}</div>
        </div>
      </div>

      {/* Activity */}
      {activity.length > 0 && (
        <div style={{ background:CARD, borderRadius:16, border:`1px solid ${BORDER}`, overflow:"hidden" }}>
          <div style={{ height:3, background:`linear-gradient(90deg,${G},transparent)` }} />
          <div style={{ padding:"16px 20px 12px", borderBottom:`1px solid ${BORDER}` }}>
            <div style={{ fontFamily:"Georgia,serif", fontSize:15, color:TEXT, fontWeight:700 }}>Recent Activity</div>
          </div>
          {activity.slice(0,5).map((a,i) => (
            <div key={a.id} style={{ display:"flex", gap:12, padding:"12px 20px", borderBottom:i<Math.min(activity.length,5)-1?`1px solid ${BORDER}`:"none", alignItems:"flex-start" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:G, flexShrink:0, marginTop:4 }} />
              <div>
                <div style={{ fontSize:12, color:TEXT }}>{a.event}</div>
                <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{fmtDate(a.event_date)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── PERSONNEL PAGE ────────────────────────────────────────────────────────
  const renderPersonnel = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontFamily:"Georgia,serif", fontSize:isMobile?18:20, color:TEXT, fontWeight:700 }}>
          Personnel <span style={{ fontSize:13, color:MUTED, fontFamily:"inherit" }}>({personnel.length})</span>
        </div>
        <button style={{ background:`linear-gradient(135deg,${G},#b8942e)`, border:"none", borderRadius:8, padding:"10px 18px", color:BG, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>+ Nominate</button>
      </div>
      <div style={{ background:CARD, borderRadius:16, border:`1px solid ${GB}`, overflow:"hidden" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,${G},transparent)` }} />
        {personnel.length === 0 && <div style={{ padding:40, textAlign:"center", color:MUTED, fontSize:13 }}>No personnel nominated yet.</div>}
        {personnel.map((p,i) => {
          const isGranted = p.stage?.toLowerCase().includes("granted") || p.stage?.toLowerCase().includes("complete");
          const isPending = p.status === "pending";
          const dotBg = isGranted ? "#059669" : isPending ? G : "rgba(255,255,255,0.15)";
          const dotBorder = isGranted ? "#059669" : isPending ? G : "rgba(255,255,255,0.2)";
          const rowBg = isPending ? "rgba(201,168,76,0.03)" : "transparent";
          const rowBorder = isPending ? `1px solid rgba(201,168,76,0.12)` : `1px solid transparent`;
          return (
            <div key={p.id} onClick={() => setSelectedP(p)}
              style={{ display:"flex", gap:12, alignItems:"center", padding:"16px 20px", borderBottom:i<personnel.length-1?`1px solid ${BORDER}`:"none", cursor:"pointer", background:rowBg, border:rowBorder }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = rowBg; }}>
              {/* Stage dot */}
              <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:dotBg, border:`2px solid ${dotBorder}` }}>
                {isGranted ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : isPending ? (
                  <div style={{ width:7, height:7, borderRadius:"50%", background:BG }} />
                ) : (
                  <div style={{ width:7, height:7, borderRadius:"50%", background:"rgba(255,255,255,0.3)" }} />
                )}
              </div>
              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color:TEXT, fontWeight:600, marginBottom:2 }}>{p.employee_name}</div>
                <div style={{ fontSize:11, color:TEXT2, marginBottom:3 }}>{p.stage||"—"}</div>
                {p.email && <div style={{ fontSize:11, color:MUTED }}>{p.email}</div>}
              </div>
              {/* Right col */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5, flexShrink:0 }}>
                <Badge text={clrLabel(p.clearance_type)} colour={clrColour(p.clearance_type)} bg={clrBg(p.clearance_type)} border={clrBorder(p.clearance_type)} />
                <Badge text={p.clearance_request_type||"New"} colour={AMBER} bg={AMD} border={AMB} />
                {p.batch_date && <div style={{ fontSize:10, color:MUTED }}>{fmtDate(p.batch_date)}</div>}
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity:0.2, flexShrink:0 }}><polyline points="4,3 9,7 4,11" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── FINANCIALS PAGE ───────────────────────────────────────────────────────
  const renderFinancials = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* Hero */}
      <div style={{ background:CARD, borderRadius:16, border:`1px solid ${GB}`, overflow:"hidden" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,${G},rgba(201,168,76,0.3),transparent)` }} />
        <div style={{ padding:isMobile?"20px 18px":"24px 28px" }}>
          <div style={{ fontSize:10, color:G, textTransform:"uppercase", letterSpacing:"2px", fontWeight:700, marginBottom:6 }}>Total Fees</div>
          <div style={{ fontFamily:"Georgia,serif", fontSize:isMobile?36:44, fontWeight:700, color:TEXT, marginBottom:8 }}>{fmtMoney(totalFees)}</div>
          <div style={{ fontSize:12, color:TEXT2 }}>{co?.total_nominees} sponsored employees · AGSVA fees included</div>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ background:CARD, borderRadius:16, border:`1px solid ${BORDER}`, overflow:"hidden" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,${G},transparent)` }} />
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:15, color:TEXT, fontWeight:700 }}>Fee Breakdown</div>
        </div>
        {[
          { label:"Application Fees", value:co?.total_application_fees, sub:`${co?.total_nominees||0} × $400 per employee` },
          { label:"Sponsorship Fees", value:co?.total_sponsorship_fees, sub:"Year 1 sponsorship at $1,460/employee" },
          { label:"AGSVA Pass-Through Fees", value:co?.total_agsva_fees, sub:"Government vetting fees at cost" },
          { label:"AusClear Fees (ex-AGSVA)", value:co?.total_fees_minus_agsva, sub:"Application + Sponsorship only" },
        ].map((row,i,arr) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px", borderBottom:i<arr.length-1?`1px solid ${BORDER}`:"none" }}>
            <div>
              <div style={{ fontSize:13, color:TEXT }}>{row.label}</div>
              {row.sub && <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{row.sub}</div>}
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:G, fontFamily:"monospace" }}>{fmtMoney(row.value)}</div>
          </div>
        ))}
      </div>

      {/* Application types */}
      <div style={{ background:CARD, borderRadius:16, border:`1px solid ${BORDER}`, overflow:"hidden" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,${G},transparent)` }} />
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:15, color:TEXT, fontWeight:700 }}>Application Types</div>
        </div>
        {[
          { label:"New Clearances", value:co?.new_total??0, col:GREEN, bg:GND, border:GNB },
          { label:"Upgrades", value:co?.upgrade_total??0, col:AMBER, bg:AMD, border:AMB },
          { label:"Transfers", value:co?.transfer_total??0, col:BLUE, bg:BLD, border:"rgba(147,197,253,0.3)" },
        ].map((row,i,arr) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px", borderBottom:i<arr.length-1?`1px solid ${BORDER}`:"none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:row.col, flexShrink:0 }} />
              <span style={{ fontSize:13, color:TEXT }}>{row.label}</span>
            </div>
            <Badge text={String(row.value)} colour={row.col} bg={row.bg} border={row.border} />
          </div>
        ))}
      </div>
    </div>
  );

  // ── ACTIVITY PAGE ─────────────────────────────────────────────────────────
  const renderActivity = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ fontFamily:"Georgia,serif", fontSize:isMobile?18:20, color:TEXT, fontWeight:700 }}>Activity Log</div>
      <div style={{ background:CARD, borderRadius:16, border:`1px solid ${GB}`, overflow:"hidden" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,${G},transparent)` }} />
        {activity.length === 0
          ? <div style={{ padding:40, textAlign:"center", color:MUTED, fontSize:13 }}>No activity yet.</div>
          : activity.map((a,i) => (
          <div key={a.id} style={{ display:"flex", gap:12, padding:"14px 20px", borderBottom:i<activity.length-1?`1px solid ${BORDER}`:"none", alignItems:"flex-start" }}>
            <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, background:GD, border:`1px solid ${GB}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
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

  // ── SUPPORT PAGE ──────────────────────────────────────────────────────────
  const renderSupport = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ fontFamily:"Georgia,serif", fontSize:isMobile?18:20, color:TEXT, fontWeight:700 }}>Support</div>
      <div style={{ background:CARD, borderRadius:16, border:`1px solid ${GB}`, overflow:"hidden" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,${G},transparent)` }} />
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:15, color:TEXT, fontWeight:700 }}>Contact AusClear</div>
        </div>
        {[
          { label:"Phone", value:"1300 027 423" },
          { label:"Email", value:"support@ausclear.com.au" },
          { label:"Hours", value:"Mon — Fri, 9am — 5pm ACST" },
          { label:"Address", value:"82 Onkaparinga Valley Road, Woodside SA 5244" },
        ].map((item,i,arr) => (
          <div key={i} style={{ padding:"14px 20px", borderBottom:i<arr.length-1?`1px solid ${BORDER}`:"none" }}>
            <div style={{ fontSize:10, color:G, textTransform:"uppercase", letterSpacing:"1.5px", fontWeight:700, marginBottom:3 }}>{item.label}</div>
            <div style={{ fontSize:13, color:TEXT }}>{item.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background:CARD, borderRadius:16, border:`1px solid ${BORDER}`, padding:"20px", overflow:"hidden" }}>
        <div style={{ fontFamily:"Georgia,serif", fontSize:15, color:TEXT, fontWeight:700, marginBottom:10 }}>Knowledge Base</div>
        <p style={{ fontSize:13, color:TEXT2, lineHeight:1.5, margin:"0 0 16px" }}>Browse 120+ articles on security clearances, AGSVA processes, and DISP requirements.</p>
        <a href="https://support.ausclear.com.au" target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
          <button style={{ background:`linear-gradient(135deg,${G},#b8942e)`, border:"none", borderRadius:8, padding:"12px 22px", color:BG, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Visit Knowledge Base</button>
        </a>
      </div>
    </div>
  );

  const pages: Record<string, () => React.ReactElement> = {
    Dashboard: renderDashboard, Personnel: renderPersonnel,
    Financials: renderFinancials, Activity: renderActivity, Support: renderSupport,
  };

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
      <div style={{ background:CARD, borderRadius:16, padding:32, border:`1px solid ${BORDER}`, textAlign:"center" }}>
        <p style={{ color:RED, fontSize:14, marginBottom:16 }}>{error}</p>
        <button onClick={() => router.push("/login")} style={{ background:`linear-gradient(135deg,${G},#b8942e)`, border:"none", borderRadius:10, padding:"12px 24px", color:BG, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Back to Login</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:BG, color:TEXT, fontSize:14, overflowX:"hidden" }}>
      <Drawer />

      {/* Sidebar overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:99 }} />}

      {/* Sidebar */}
      <div style={{ position:"fixed", top:0, left:0, bottom:0, width:240, background:CARD, zIndex:100, borderRight:`1px solid ${BORDER}`, display:"flex", flexDirection:"column", transform:sidebarOpen?"translateX(0)":"translateX(-100%)", transition:"transform 0.3s cubic-bezier(0.4,0,0.2,1)", overflowY:"auto" }}>
        <div style={{ padding:"24px 20px 20px", borderBottom:`1px solid ${BORDER}` }}>
          <img src="https://ausclear.au/AusClear-Light-Transparent.png" alt="AusClear" style={{ height:28 }} />
          <div style={{ fontSize:10, color:G, textTransform:"uppercase", letterSpacing:"2px", fontWeight:700, marginTop:6 }}>Corporate Portal</div>
        </div>
        {co && (
          <div style={{ padding:"14px 20px", borderBottom:`1px solid ${BORDER}`, background:"rgba(201,168,76,0.04)" }}>
            <div style={{ fontSize:12, color:G, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{co.company_name}</div>
            <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{data?.user?.email}</div>
          </div>
        )}
        <nav style={{ flex:1, padding:"12px 10px" }}>
          {NAV.map(item => {
            const active = page === item;
            return (
              <button key={item} onClick={() => { setPage(item); setSidebarOpen(false); }}
                style={{ display:"flex", alignItems:"center", width:"100%", padding:"12px 14px", borderRadius:10, border:"none", background:active?GD:"transparent", color:active?G:TEXT2, fontSize:13, fontWeight:active?700:500, cursor:"pointer", fontFamily:"inherit", textAlign:"left", marginBottom:2 }}>
                {item}
              </button>
            );
          })}
        </nav>
        <div style={{ padding:"12px 10px 20px", borderTop:`1px solid ${BORDER}` }}>
          <button onClick={() => router.push("/logout")} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"12px 14px", borderRadius:10, border:"none", background:"transparent", color:TEXT2, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Topbar */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:`${CARD}ee`, backdropFilter:"blur(16px)", borderBottom:`1px solid ${BORDER}`, padding:"0 16px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:TEXT2, fontSize:20, lineHeight:1 }}>☰</button>
          <span style={{ fontFamily:"Georgia,serif", fontSize:15, color:TEXT, fontWeight:700 }}>{page}</span>
        </div>
        <div style={{ fontSize:11, color:G, fontWeight:700 }}>{co?.company_name||""}</div>
      </div>

      {/* Main content */}
      <main style={{ padding:isMobile?"16px 12px 80px":"20px 16px 60px", maxWidth:720, margin:"0 auto" }}>
        {pages[page]?.()}
      </main>

      <style>{`
        @keyframes portalPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.15)} }
      `}</style>
    </div>
  );
}
