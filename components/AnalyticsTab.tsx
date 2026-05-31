"use client";
import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Area, AreaChart,
} from "recharts";

/* ═══ PALETTE — matches Dashboard.tsx ═══ */
const C = {
  bg: "#07070a", card: "#111318", card2: "#161922",
  line: "#1f2535", gold: "#c9a84c", goldDim: "rgba(201,168,76,0.12)",
  text: "#e8e5de", sub: "#b0ada5", muted: "#7a7a82", dim: "#4a4a52",
  green: "#5cb87a", blue: "#6b9fd4", amber: "#d4935c", red: "#c97a7a",
  purple: "#b07ee8",
};

/* ═══ TYPES — mirror Dashboard types ═══ */
type Co = {
  company_name: string; abn: string; account_number: string;
  total_nominees: number; new_total: number; upgrade_total: number; transfer_total: number;
  baseline_total: number; nv1_total: number; nv2_total: number;
  total_agsva_fees: number; total_application_fees: number;
  total_sponsorship_fees: number; total_fees_minus_agsva: number; total_fees: number;
  corp_deal_stage: string;
};
type P = {
  id: string; employee_name: string; email: string; mobile: string;
  clearance_type: string; clearance_request_type: string; stage: string;
  onboarding_status: string; batch_date: string | null;
  linked_deal_name: string | null;
  employee_number: number | null; revalidation_date: string | null;
};
type Batch = {
  id: string; deal_name: string; stage: string; amount: number;
  created_time: string; batch_date: string; nominee_count: number;
  baseline_count: number; nv1_count: number; nv2_count: number;
  upgrade_count: number; new_count: number;
  agsva_fees: number; app_fees: number; sponsor_fees: number;
  total_fees: number; ex_agsva: number; nominees: P[];
};
type Props = { company: Co | undefined; personnel: P[]; batches: Batch[]; isMobile: boolean };

/* ═══ STAGE MAP ═══ */
const STAGE_ORD: Record<string, { f: string; o: number }> = {
  "Awaiting Application Form":  { f: "Awaiting Application Form", o: -1 },
  "Sponsorship Created":       { f: "Sponsorship Created", o: 0 },
  "Onboard Employee for ESC":  { f: "Commencing Screening", o: 1 },
  "ESC Pending":               { f: "Screening Underway", o: 2 },
  "ESC Completed":             { f: "Screening Complete", o: 3 },
  "ESC Approved":              { f: "Screening Approved", o: 4 },
  "AGSVA Portal Access":       { f: "AGSVA Portal Access", o: 5 },
  "AGSVA Portal":              { f: "AGSVA Portal Active", o: 6 },
  "AGSVA Clearance Onboard":   { f: "Lodging Application", o: 7 },
  "AGSVA Clearance Pending":   { f: "Vetting Underway", o: 8 },
  "AGSVA Clearance Granted":   { f: "Clearance Granted", o: 9 },
};
const ALL_STAGES = Object.values(STAGE_ORD).sort((a, b) => a.o - b.o).map(s => s.f);

const CLR_C: Record<string, string> = { Baseline: C.green, NV1: C.blue, NV2: C.amber };
const REQ_C: Record<string, string> = { New: C.blue, Upgrade: C.gold, Transfer: C.purple };
const fmt = (v: number) => "$" + Number(v).toLocaleString("en-AU");

/* ═══ SUB-COMPONENTS ═══ */
const TT = ({ active, payload, label, cur }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.card2, border: `1px solid ${C.line}`, borderRadius: 6, padding: "8px 12px", fontSize: 11, color: C.text, boxShadow: "0 8px 24px rgba(0,0,0,.5)" }}>
      {label && <div style={{ color: C.muted, marginBottom: 3, fontWeight: 600, fontSize: 10 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color || p.fill, flexShrink: 0 }} />
          <span style={{ color: C.sub }}>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>{cur ? fmt(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

const Badge = ({ text, color }: { text: string; color: string }) => (
  <span style={{ padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 600, background: color + "1a", color, border: `1px solid ${color}33`, whiteSpace: "nowrap" }}>{text}</span>
);

const PBar = ({ value, max, color, h = 4 }: { value: number; max: number; color: string; h?: number }) => (
  <div style={{ background: C.line, borderRadius: h, height: h, width: "100%", overflow: "hidden" }}>
    <div style={{ background: color, height: "100%", width: `${max ? (value / max) * 100 : 0}%`, borderRadius: h, transition: "width .4s" }} />
  </div>
);

/* Arc helpers */
function pol2cart(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = pol2cart(cx, cy, r, startDeg);
  const e = pol2cart(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

const Gauge = ({ value, max, label, color, size = 80 }: { value: number; max: number; label: string; color: string; size?: number }) => {
  const pct = max ? Math.round((value / max) * 100) : 0;
  const r = size * 0.38;
  const sw = Math.max(4, size * 0.065);
  const cx = size / 2, cy = size / 2;
  const startA = 225;
  const totalSweep = 270;
  const endTrack = startA + totalSweep;
  const endFill = startA + (pct / 100) * totalSweep;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
        <svg width={size} height={size}>
          <path d={arcPath(cx, cy, r, startA, endTrack)} fill="none" stroke={C.line} strokeWidth={sw} strokeLinecap="round" />
          {pct > 1 && <path d={arcPath(cx, cy, r, startA, endFill)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />}
        </svg>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
          <div style={{ fontSize: Math.max(11, size * 0.18), fontWeight: 700, color: C.text, lineHeight: 1 }}>{pct}%</div>
        </div>
      </div>
      <div style={{ fontSize: 8, color: C.muted, marginTop: 1, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</div>
      <div style={{ fontSize: 10, color: C.sub, fontWeight: 600 }}>{value}/{max}</div>
    </div>
  );
};

const Spark = ({ data, color, height = 24 }: { data: { v: number }[]; color: string; height?: number }) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={`sp${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sp${color.replace("#", "")})`} dot={false} />
    </AreaChart>
  </ResponsiveContainer>
);

const SH = ({ title, icon, count, mob }: { title: string; icon: string; count?: string | number; mob?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: mob ? 8 : 12 }}>
    <span style={{ fontSize: mob ? 11 : 13 }}>{icon}</span>
    <span style={{ fontSize: mob ? 11 : 13, fontWeight: 700, color: C.text, letterSpacing: 0.2 }}>{title}</span>
    {count !== undefined && <span style={{ fontSize: 9, color: C.muted, background: C.line, padding: "1px 6px", borderRadius: 8 }}>{count}</span>}
  </div>
);

const Card = ({ children, style: s }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, ...s }}>{children}</div>
);

/* ═══ ANALYTICS TAB ═══ */
export default function AnalyticsTab({ company: co, personnel: ppl, batches: allBatches, isMobile: mob }: Props) {
  const [subView, setSubView] = useState<"overview" | "financial" | "personnel">("overview");
  const [expandedEmp, setExpandedEmp] = useState<string | null>(null);

  /* Filter to live batches only — a batch is live when at least one nominee has an active deal stage */
  const batches = useMemo(() =>
    allBatches.filter(b => b.nominees.some(n => n.stage && STAGE_ORD[n.stage] !== undefined))
  , [allBatches]);

  /* ── Derived data ── */
  const granted = ppl.filter(e => e.stage === "AGSVA Clearance Granted" || e.stage === "Closed Won").length;
  const inProg = ppl.length - granted;
  const gPct = ppl.length ? Math.round((granted / ppl.length) * 100) : 0;
  const totalCost = co ? co.total_agsva_fees + co.total_application_fees + co.total_sponsorship_fees : 0;
  const avgCost = ppl.length ? Math.round(totalCost / ppl.length) : 0;

  /* Clearance breakdown */
  const clrData = useMemo(() => {
    const m: Record<string, number> = {};
    ppl.forEach(e => {
      const cl = e.clearance_type?.includes("NV2") ? "NV2" : e.clearance_type?.includes("NV1") ? "NV1" : "Baseline";
      m[cl] = (m[cl] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [ppl]);

  /* Request breakdown */
  const reqData = useMemo(() => {
    const m: Record<string, number> = {};
    ppl.forEach(e => {
      const r = e.clearance_request_type || "New";
      m[r] = (m[r] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [ppl]);

  /* Pipeline distribution */
  const pipeline = useMemo(() => {
    const c: Record<string, { stage: string; count: number; o: number }> = {};
    ALL_STAGES.forEach((f, i) => { c[f] = { stage: f, count: 0, o: i }; });
    ppl.forEach(e => {
      const s = STAGE_ORD[e.stage];
      if (s) c[s.f].count++;
    });
    return Object.values(c).sort((a, b) => a.o - b.o);
  }, [ppl]);

  /* Batch timeline data */
  const batchTimeline = useMemo(() => {
    return batches.map(b => ({
      batch: b.batch_date || b.deal_name,
      Baseline: b.baseline_count,
      NV1: b.nv1_count,
      NV2: b.nv2_count,
    })).sort((a, b) => a.batch.localeCompare(b.batch));
  }, [batches]);

  /* Financial per batch */
  const finPerBatch = useMemo(() => {
    return batches.map(b => ({
      batch: b.batch_date || b.deal_name,
      Application: b.app_fees,
      Sponsorship: b.sponsor_fees,
      AGSVA: b.agsva_fees,
    })).sort((a, b) => a.batch.localeCompare(b.batch));
  }, [batches]);

  /* Sparkline data */
  const sparkE = batches.map(b => ({ v: b.nominee_count }));
  const sparkC = batches.map(b => ({ v: b.total_fees }));

  /* Per-clearance gauge data */
  const gaugeData = useMemo(() => {
    return ["Baseline", "NV1", "NV2"].map(cl => {
      const total = ppl.filter(e =>
        cl === "NV2" ? e.clearance_type?.includes("NV2") :
        cl === "NV1" ? e.clearance_type?.includes("NV1") && !e.clearance_type?.includes("NV2") :
        !e.clearance_type?.includes("NV1") && !e.clearance_type?.includes("NV2")
      ).length;
      const done = ppl.filter(e => {
        const match = cl === "NV2" ? e.clearance_type?.includes("NV2") :
          cl === "NV1" ? e.clearance_type?.includes("NV1") && !e.clearance_type?.includes("NV2") :
          !e.clearance_type?.includes("NV1") && !e.clearance_type?.includes("NV2");
        return match && (e.stage === "AGSVA Clearance Granted" || e.stage === "Closed Won");
      }).length;
      return { label: cl, total, done, color: CLR_C[cl] || C.muted };
    }).filter(g => g.total > 0);
  }, [ppl]);

  /* Employee progress */
  const progress = useMemo(() => {
    return ppl.map(e => {
      const s = STAGE_ORD[e.stage];
      const pct = s ? Math.round(((s.o + 1) / 10) * 100) : (e.stage === "Closed Won" ? 100 : 0);
      const cl = e.clearance_type?.includes("NV2") ? "NV2" : e.clearance_type?.includes("NV1") ? "NV1" : "Baseline";
      return {
        ...e, pct, friendly: s?.f || e.stage, cl,
        cost: (cl === "NV2" ? 2486 : cl === "NV1" ? 1355 : 884) + 400 + 1460,
      };
    }).sort((a, b) => b.pct - a.pct);
  }, [ppl]);

  /* Sub-view tabs */
  const SUB_TABS = [
    { id: "overview" as const, label: "Overview", icon: "◫" },
    { id: "financial" as const, label: "Financial", icon: "◈" },
    { id: "personnel" as const, label: "Staff", icon: "◉" },
  ];

  const pad = mob ? 0 : 0;

  /* KPI card */
  const KPI = ({ label, value, sub, color, spark, sparkColor }: {
    label: string; value: string | number; sub?: string; color: string;
    spark?: { v: number }[]; sparkColor?: string;
  }) => (
    <div style={{
      background: C.card, border: `1px solid ${C.line}`, borderRadius: 8,
      padding: mob ? "12px 14px" : "14px 16px", position: "relative", overflow: "hidden",
      flex: mob ? "1 1 calc(50% - 6px)" : "1 1 0",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: color, borderRadius: "8px 0 0 8px" }} />
      <div style={{ fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ fontSize: mob ? 18 : 22, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>{value}</div>
          {sub && <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{sub}</div>}
        </div>
        {spark && !mob && <div style={{ width: 56, height: 24 }}><Spark data={spark} color={sparkColor || color} /></div>}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Sub-view tabs */}
      <div style={{ display: "flex", gap: 2, background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: 3 }}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSubView(t.id)} style={{
            flex: 1, padding: mob ? "8px 0" : "8px 16px",
            background: subView === t.id ? "rgba(201,168,76,0.08)" : "transparent",
            border: subView === t.id ? `1px solid rgba(201,168,76,0.25)` : "1px solid transparent",
            color: subView === t.id ? C.gold : C.muted,
            cursor: "pointer", fontSize: 11, fontWeight: 600, borderRadius: 6,
            transition: "all 0.15s",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {subView === "overview" && <>

        {/* KPIs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: mob ? 8 : 12 }}>
          <KPI label="Total Employees" value={ppl.length} sub={`${batches.length} batch${batches.length !== 1 ? "es" : ""}`} color={C.blue} spark={sparkE} sparkColor={C.blue} />
          <KPI label="Granted" value={granted} sub={`${gPct}% rate`} color={C.green} />
          <KPI label="In Progress" value={inProg} color={C.amber} />
          <KPI label="Investment" value={fmt(totalCost)} sub={`${fmt(avgCost)} avg`} color={C.gold} spark={sparkC} sparkColor={C.gold} />
        </div>

        {/* Pipeline + Gauges */}
        <div style={{ display: mob ? "flex" : "grid", gridTemplateColumns: "1fr 260px", flexDirection: "column", gap: 12 }}>
          <Card style={{ padding: mob ? 12 : 16 }}>
            <SH title="Pipeline Distribution" icon="▦" count={ppl.length} mob={mob} />
            <ResponsiveContainer width="100%" height={mob ? 220 : 280}>
              <BarChart data={pipeline} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="stage" width={mob ? 100 : 130} tick={{ fill: C.sub, fontSize: mob ? 9 : 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TT />} cursor={{ fill: C.goldDim }} />
                <Bar dataKey="count" name="Employees" radius={[0, 4, 4, 0]} maxBarSize={16}>
                  {pipeline.map((e, i) => (
                    <Cell key={i} fill={e.stage === "Clearance Granted" ? C.green : C.blue} fillOpacity={e.count > 0 ? 0.8 : 0.2} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card style={{ padding: mob ? 12 : 16 }}>
            <SH title="Completion" icon="◎" mob={mob} />
            <div style={{ display: "flex", flexDirection: mob ? "row" : "column", alignItems: "center", gap: mob ? 16 : 10, justifyContent: "center", paddingTop: 4 }}>
              <Gauge value={granted} max={ppl.length} label="Overall" color={C.green} size={mob ? 76 : 90} />
              <div style={{ display: "flex", gap: mob ? 12 : 14 }}>
                {gaugeData.map(g => (
                  <Gauge key={g.label} value={g.done} max={g.total} label={g.label} color={g.color} size={mob ? 60 : 68} />
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Donuts + Batch Timeline */}
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "200px 200px 1fr", gap: 12 }}>
          <Card style={{ padding: mob ? 12 : 16 }}>
            <SH title="Clearance" icon="◐" mob={mob} />
            <ResponsiveContainer width="100%" height={mob ? 130 : 160}>
              <PieChart>
                <Pie data={clrData} cx="50%" cy="50%" innerRadius={mob ? 30 : 38} outerRadius={mob ? 48 : 58} paddingAngle={3} dataKey="value" stroke="none">
                  {clrData.map((e, i) => <Cell key={i} fill={CLR_C[e.name] || C.muted} />)}
                </Pie>
                <Tooltip content={<TT />} />
              </PieChart>
            </ResponsiveContainer>
            {clrData.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: mob ? 10 : 11, marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: CLR_C[d.name], flexShrink: 0 }} />
                  <span style={{ color: C.sub }}>{d.name}</span>
                </div>
                <span style={{ fontWeight: 700 }}>{d.value}</span>
              </div>
            ))}
          </Card>
          <Card style={{ padding: mob ? 12 : 16 }}>
            <SH title="Request" icon="◑" mob={mob} />
            <ResponsiveContainer width="100%" height={mob ? 130 : 160}>
              <PieChart>
                <Pie data={reqData} cx="50%" cy="50%" innerRadius={mob ? 30 : 38} outerRadius={mob ? 48 : 58} paddingAngle={3} dataKey="value" stroke="none">
                  {reqData.map((e, i) => <Cell key={i} fill={REQ_C[e.name] || C.muted} />)}
                </Pie>
                <Tooltip content={<TT />} />
              </PieChart>
            </ResponsiveContainer>
            {reqData.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: mob ? 10 : 11, marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: REQ_C[d.name], flexShrink: 0 }} />
                  <span style={{ color: C.sub }}>{d.name}</span>
                </div>
                <span style={{ fontWeight: 700 }}>{d.value}</span>
              </div>
            ))}
          </Card>
          <Card style={{ padding: mob ? 12 : 16, gridColumn: mob ? "1 / -1" : "auto" }}>
            <SH title="Batch Timeline" icon="▥" count={`${batches.length} batch${batches.length !== 1 ? "es" : ""}`} mob={mob} />
            <ResponsiveContainer width="100%" height={mob ? 180 : 220}>
              <BarChart data={batchTimeline} margin={{ left: -10, right: 8, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                <XAxis dataKey="batch" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<TT />} cursor={{ fill: C.goldDim }} />
                <Bar dataKey="Baseline" stackId="a" fill={C.green} maxBarSize={mob ? 20 : 28} />
                <Bar dataKey="NV1" stackId="a" fill={C.blue} maxBarSize={mob ? 20 : 28} />
                <Bar dataKey="NV2" stackId="a" fill={C.amber} maxBarSize={mob ? 20 : 28} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </>}

      {/* ═══ FINANCIAL ═══ */}
      {subView === "financial" && <>

        {/* Financial KPIs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: mob ? 8 : 12 }}>
          <KPI label="Total Investment" value={fmt(totalCost)} color={C.gold} />
          <KPI label="Application Fees" value={fmt(co?.total_application_fees || 0)} sub={`${ppl.length} × $400`} color={C.amber} />
          <KPI label="Sponsorship Fees" value={fmt(co?.total_sponsorship_fees || 0)} sub="$1,460 per employee" color={C.blue} />
          <KPI label="AGSVA Fees" value={fmt(co?.total_agsva_fees || 0)} sub="Govt vetting at cost" color={C.green} />
        </div>

        {/* Fee breakdown donut */}
        <div style={{ display: mob ? "flex" : "grid", gridTemplateColumns: "280px 1fr", flexDirection: "column", gap: 12 }}>
          <Card style={{ padding: mob ? 12 : 16 }}>
            <SH title="Fee Composition" icon="◎" mob={mob} />
            <ResponsiveContainer width="100%" height={mob ? 180 : 200}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Application", value: co?.total_application_fees || 0 },
                    { name: "Sponsorship", value: co?.total_sponsorship_fees || 0 },
                    { name: "AGSVA", value: co?.total_agsva_fees || 0 },
                  ]}
                  cx="50%" cy="50%" innerRadius={mob ? 42 : 52} outerRadius={mob ? 65 : 75}
                  paddingAngle={3} dataKey="value" stroke="none"
                >
                  <Cell fill={C.amber} />
                  <Cell fill={C.gold} />
                  <Cell fill={C.blue} />
                </Pie>
                <Tooltip content={<TT cur />} />
              </PieChart>
            </ResponsiveContainer>
            {[
              { l: "Application", c: C.amber, v: co?.total_application_fees || 0 },
              { l: "Sponsorship", c: C.gold, v: co?.total_sponsorship_fees || 0 },
              { l: "AGSVA", c: C.blue, v: co?.total_agsva_fees || 0 },
            ].map(d => (
              <div key={d.l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, marginTop: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: d.c, flexShrink: 0 }} />
                  <span style={{ color: C.sub }}>{d.l}</span>
                </div>
                <span style={{ fontWeight: 700, color: C.gold }}>{fmt(d.v)}</span>
              </div>
            ))}
          </Card>

          {/* Investment area chart */}
          <Card style={{ padding: mob ? 12 : 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
              <SH title="Investment by Batch" icon="▤" mob={mob} />
              <div style={{ display: "flex", gap: mob ? 8 : 14 }}>
                {[{ l: "Application", c: C.amber }, { l: "Sponsorship", c: C.gold }, { l: "AGSVA", c: C.blue }].map(x => (
                  <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: C.muted }}>
                    <span style={{ width: 6, height: 3, borderRadius: 2, background: x.c }} />{x.l}
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={mob ? 200 : 240}>
              <AreaChart data={finPerBatch} margin={{ left: 8, right: 8, top: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gA2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.amber} stopOpacity={0.3} /><stop offset="100%" stopColor={C.amber} stopOpacity={0} /></linearGradient>
                  <linearGradient id="gS2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity={0.3} /><stop offset="100%" stopColor={C.gold} stopOpacity={0} /></linearGradient>
                  <linearGradient id="gV2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue} stopOpacity={0.3} /><stop offset="100%" stopColor={C.blue} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                <XAxis dataKey="batch" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<TT cur />} />
                <Area type="monotone" dataKey="Application" stackId="1" stroke={C.amber} fill="url(#gA2)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="Sponsorship" stackId="1" stroke={C.gold} fill="url(#gS2)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="AGSVA" stackId="1" stroke={C.blue} fill="url(#gV2)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Batch cost table */}
        <Card style={{ padding: mob ? 12 : 16 }}>
          <SH title="Cost per Batch" icon="▧" count={batches.length} mob={mob} />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Batch", "Employees", "Application", "Sponsorship", "AGSVA", "Total"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: `1px solid ${C.line}`, fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.sort((a, b) => (a.batch_date || "").localeCompare(b.batch_date || "")).map(b => (
                  <tr key={b.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: C.sub }}>{b.batch_date || b.deal_name}</td>
                    <td style={{ padding: "10px 12px", color: C.text }}>{b.nominee_count}</td>
                    <td style={{ padding: "10px 12px", color: C.muted }}>{fmt(b.app_fees)}</td>
                    <td style={{ padding: "10px 12px", color: C.muted }}>{fmt(b.sponsor_fees)}</td>
                    <td style={{ padding: "10px 12px", color: C.muted }}>{fmt(b.agsva_fees)}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: C.gold }}>{fmt(b.total_fees)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid ${C.line}` }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: C.gold }}>TOTAL</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>{ppl.length}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: C.gold }}>{fmt(co?.total_application_fees || 0)}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: C.gold }}>{fmt(co?.total_sponsorship_fees || 0)}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: C.gold }}>{fmt(co?.total_agsva_fees || 0)}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: C.gold, fontSize: 14 }}>{fmt(totalCost)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </>}

      {/* ═══ PERSONNEL ═══ */}
      {subView === "personnel" && <>
        <Card style={{ padding: mob ? 12 : 16 }}>
          <SH title="Employee Clearance Progress" icon="◉" count={ppl.length} mob={mob} />
          {mob ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {progress.map(e => {
                const done = e.pct === 100;
                const exp = expandedEmp === e.id;
                return (
                  <div key={e.id} onClick={() => setExpandedEmp(exp ? null : e.id)}
                    style={{ background: C.card2, border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 12 }}>{e.employee_name}</span>
                      <span style={{ fontSize: 10, color: done ? C.green : C.sub, fontWeight: 700 }}>{e.pct}%</span>
                    </div>
                    <PBar value={e.pct} max={100} color={done ? C.green : C.blue} h={5} />
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <Badge text={e.cl} color={CLR_C[e.cl] || C.muted} />
                      <Badge text={e.clearance_request_type || "New"} color={REQ_C[e.clearance_request_type] || C.muted} />
                    </div>
                    {exp && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11 }}>
                        <div><span style={{ color: C.dim }}>Stage</span><div style={{ color: done ? C.green : C.sub }}>{e.friendly}</div></div>
                        <div><span style={{ color: C.dim }}>Batch</span><div style={{ color: C.sub }}>{e.batch_date || "—"}</div></div>
                        <div><span style={{ color: C.dim }}>Email</span><div style={{ color: C.sub, wordBreak: "break-all" }}>{e.email || "—"}</div></div>
                        <div><span style={{ color: C.dim }}>Est. Cost</span><div style={{ color: C.gold, fontWeight: 700 }}>{fmt(e.cost)}</div></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Employee", "Clearance", "Request", "Batch", "Stage", "Progress", "Cost"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: `1px solid ${C.line}`, fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {progress.map(e => {
                    const done = e.pct === 100;
                    return (
                      <tr key={e.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontWeight: 600 }}>{e.employee_name}</div>
                          <div style={{ fontSize: 10, color: C.dim }}>{e.email || "—"}</div>
                        </td>
                        <td style={{ padding: "10px 12px" }}><Badge text={e.cl} color={CLR_C[e.cl] || C.muted} /></td>
                        <td style={{ padding: "10px 12px" }}><Badge text={e.clearance_request_type || "New"} color={REQ_C[e.clearance_request_type] || C.muted} /></td>
                        <td style={{ padding: "10px 12px", color: C.muted }}>{e.batch_date || "—"}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: done ? C.green : C.amber, flexShrink: 0 }} />
                            <span style={{ color: done ? C.green : C.sub, fontSize: 11 }}>{e.friendly}</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", minWidth: 120 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1 }}><PBar value={e.pct} max={100} color={done ? C.green : C.blue} /></div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: done ? C.green : C.sub, minWidth: 28, textAlign: "right" }}>{e.pct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: C.gold }}>{fmt(e.cost)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </>}
    </div>
  );
}
