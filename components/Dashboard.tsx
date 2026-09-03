"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import NominateModal from "./NominateModal";
import AnalyticsTab from "./AnalyticsTab";
import MessagesTab from "./MessagesTab";

const DARK = {
  bg:    "#07070a", side:  "#0d1018", card:  "#111318", card2: "#161922",
  line:  "#1f2535", gold:  "#c9a84c", goldD: "rgba(201,168,76,0.12)",
  brandGold: "#c9a84c",
  text:  "#e8e5de", muted: "#7a7a82", dim:   "#4a4a52",
  green: "#5cb87a", blue:  "#6b9fd4", amber: "#d4935c", red:   "#c97a7a",
  topbar: "rgba(13,16,24,0.97)",
};
const LIGHT = {
  bg:    "#f4f5f7", side:  "#ffffff", card:  "#ffffff", card2: "#f8f9fa",
  line:  "#e2e4e9", gold:  "#2563b0", goldD: "rgba(37,99,176,0.08)",
  brandGold: "#9a7530",
  text:  "#1a1a2e", muted: "#6b6b7b", dim:   "#9a9aaa",
  green: "#2d8a4e", blue:  "#3a76b0", amber: "#c07c2a", red:   "#c05050",
  topbar: "rgba(255,255,255,0.97)",
};

const clrTag = (c: string) =>
  c?.includes("NV2") ? { label:"NV2", col:"#c9a84c",  bg:"rgba(201,168,76,0.15)",  bdr:"rgba(201,168,76,0.4)"  } :
  c?.includes("NV1") ? { label:"NV1", col:"#6b9fd4",  bg:"rgba(107,159,212,0.15)", bdr:"rgba(107,159,212,0.4)" } :
                       { label:"BSL", col:"#7a7a82", bg:"rgba(122,122,130,0.12)", bdr:"rgba(122,122,130,0.3)" };

const SL: Record<string, string> = {  "Onboard Corporate Account": "Account Setup",
  "Prepare Contract":          "Preparing Agreement",
  "Send Contract":             "Agreement Sent",
  "Contract Sent":             "Agreement Sent",
  "Signature Pending":         "Awaiting Signature",
  "Awaiting Signature":        "Awaiting Signature",
  "Contracts Signed":          "Agreement Signed",
  "Contract Signed":           "Agreement Signed",
  "Create Invoice":            "Invoice Preparation",
  "Invoice Partially Paid":    "Payment Pending",
  "Invoice Sent":              "Invoice Sent",
  "Invoice Outstanding":       "Payment Pending",
  "Invoice Paid":              "Payment Received",
  "Corporate Approved":        "Active & Approved",
  "Corporate Declined":        "Declined",
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
  "Onboard Corporate Account","Prepare Contract","Send Contract","Contract Sent",
  "Awaiting Signature","Signature Pending","Contracts Signed","Create Invoice",
  "Invoice Sent","Invoice Outstanding","Invoice Partially Paid","Invoice Paid","Corporate Approved",
];

const EMP_STAGES = [
  "Sponsorship Created","Onboard Employee for ESC","ESC Pending",
  "ESC Completed","ESC Approved","AGSVA Portal Access",
  "AGSVA Portal","AGSVA Clearance Onboard","AGSVA Clearance Pending",
  "AGSVA Clearance Granted",
];

const EMP_MILESTONES = [
  { stages:["Sponsorship Created","Onboard Employee for ESC"], label:"Created" },
  { stages:["ESC Pending"], label:"Screening" },
  { stages:["ESC Completed","ESC Approved"], label:"Approved" },
  { stages:["AGSVA Portal Access","AGSVA Portal","AGSVA Clearance Onboard"], label:"AGSVA" },
  { stages:["AGSVA Clearance Pending"], label:"Vetting" },
  { stages:["AGSVA Clearance Granted"], label:"Granted" },
];

type Co = {
  company_name: string; abn: string; account_number: string;
  email?: string; phone?: string; website?: string; industry?: string;
  billing_first_name?: string; billing_last_name?: string;
  billing_email?: string; billing_phone?: string; billing_job_title?: string;
  billing_street?: string; billing_suburb?: string; billing_state?: string;
  billing_postcode?: string; billing_country?: string;
  auth_first_name?: string; auth_last_name?: string;
  auth_email?: string; auth_phone?: string; auth_job_title?: string;
  clearance_authoriser?: string; billing_authoriser?: string;
  payment_preference?: string; direct_debit?: boolean; purchase_order?: string;
  application_number?: string; applications_received?: string; onboarding_complete?: boolean;
  total_nominees: number; new_total: number; upgrade_total: number; transfer_total: number;
  baseline_total: number; nv1_total: number; nv2_total: number;
  total_agsva_fees: number; total_application_fees: number;
  total_sponsorship_fees: number; total_fees_minus_agsva: number; total_fees: number;
  corp_deal_stage: string; corp_deal_name?: string; corp_deal_amount?: number; corp_deal_created?: string;
  promotional_offer?: string | null;
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
  promotional_offer?: string | null; discount?: number;
};
type Data = { company: Co; personnel: P[]; activity: A[]; batches: Batch[]; user: { email: string } };

const $k = (n?: number | null) => n != null ? `$${Number(n).toLocaleString("en-AU")}` : "—";
const $d = (s?: string | null) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return s; }
};

function Pill({ t }: { t: { label:string; col:string; bg:string; bdr:string } }) {
  return <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase" as const,
    color:t.col, background:t.bg, border:`1px solid ${t.bdr}`, padding:"2px 8px", borderRadius:3 }}>{t.label}</span>;
}

function Chevrons({ stages, active, dark = true }: { stages: string[]; active: string; dark?: boolean }) {
  const H=34, TIP=11, W=150, OVR=TIP;
  const totalW = stages.length * W - (stages.length - 1) * OVR;
  const activeIdx = stages.indexOf(active);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ on:false, sx:0, sl:0 });

  /* Auto-scroll to centre the active stage */
  useEffect(() => {
    if (!ref.current || activeIdx < 0) return;
    const activeCentre = activeIdx * (W - OVR) + W / 2;
    const containerW = ref.current.clientWidth;
    ref.current.scrollLeft = activeCentre - containerW / 2;
  }, [activeIdx]);

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
          const isActive = i === activeIdx, isDone = i < activeIdx;
          const isFirst = i === 0, isLast = i === stages.length - 1;
          let pts: string;
          if (isFirst && isLast) pts = `${x},0 ${x+W},0 ${x+W},${H} ${x},${H}`;
          else if (isFirst)      pts = `${x},0 ${x+W-TIP},0 ${x+W},${H/2} ${x+W-TIP},${H} ${x},${H}`;
          else if (isLast)       pts = `${x},0 ${x+W},0 ${x+W},${H} ${x},${H} ${x+TIP},${H/2}`;
          else                   pts = `${x},0 ${x+W-TIP},0 ${x+W},${H/2} ${x+W-TIP},${H} ${x},${H} ${x+TIP},${H/2}`;
          const fill = dark
            ? (isActive ? "#1e4a8c" : isDone ? "#163d6e" : "#1a1f2e")
            : (isActive ? "#2563b0" : isDone ? "#4a90c4" : "#dfe2e8");
          const tCol = dark
            ? (isActive ? "#fff" : isDone ? "rgba(255,255,255,0.6)" : "#3a3a52")
            : (isActive ? "#fff" : isDone ? "#fff" : "#8a8a9a");
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

export default function Dashboard() {
  const [tab, setTab]             = useState<"overview"|"batches"|"personnel"|"financials"|"analytics"|"messages"|"account"|"settings">("overview");
  const [showWelcome, setShowWelcome] = useState(true);
  const [notifBanner, setNotifBanner] = useState<{text:string;type:string}|null>(null);
  const [isAdmin, setIsAdmin]     = useState(false);
  const [data, setData]           = useState<Data | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [expandedP, setExpandedP] = useState<string | null>(null);
  const [expandedB, setExpandedB] = useState<string | null>(null);
  const [expandedE, setExpandedE] = useState<string | null>(null);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [isMobile, setIsMobile]   = useState(false);
  const [showNominate, setShowNominate] = useState(false);
  const [mounted, setMounted]     = useState(false);
  const [theme, setTheme]         = useState<"dark"|"light">("dark");
  
  useEffect(() => {
    const saved = localStorage.getItem("ausclear_theme") as "dark"|"light" | null;
    if (saved) setTheme(saved);
    if (sessionStorage.getItem("admin_impersonate") === "1") setIsAdmin(true);
    setMounted(true);
  }, []);

  const C = theme === "dark" ? DARK : LIGHT;
  const isDark = theme === "dark";
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("ausclear_theme", next);
  };
  const router = useRouter();

  /* Animated counter hook */
  const AnimNum = ({ value, prefix = "", duration = 800 }: { value: number; prefix?: string; duration?: number }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
      if (!value) { setDisplay(0); return; }
      let start = 0;
      const step = value / (duration / 16);
      const timer = setInterval(() => {
        start += step;
        if (start >= value) { setDisplay(value); clearInterval(timer); }
        else setDisplay(Math.floor(start));
      }, 16);
      return () => clearInterval(timer);
    }, [value, duration]);
    return <>{prefix}{typeof value === "number" && !prefix ? display.toLocaleString("en-AU") : `${prefix}${display.toLocaleString("en-AU")}`}</>;
  };

  /* Unread messages — Supabase Realtime for instant updates */
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  useEffect(() => {
    if (!mounted) return;
    const acct = sessionStorage.getItem("account_number");
    if (!acct) return;
    const SUPA_URL = "https://qraxdkzmteogkbfatvir.supabase.co";
    const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const check = () => {
      fetch(`/api/dashboard/messages?account_number=${encodeURIComponent(acct)}`)
        .then(r => r.json())
        .then(d => { setUnreadMsgCount((d.messages || []).filter((m: any) => m.from_type === "admin" && !m.read_status).length); })
        .catch(() => {});
    };
    check();
    /* Realtime subscription */
    let ws: WebSocket | null = null;
    try {
      const wsUrl = SUPA_URL.replace("https://", "wss://") + "/realtime/v1/websocket?apikey=" + SUPA_ANON + "&vsn=1.0.0";
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        ws?.send(JSON.stringify({ topic: "realtime:public:client_messages", event: "phx_join", payload: { config: { broadcast: { self: true }, postgres_changes: [{ event: "*", schema: "public", table: "client_messages", filter: "client_id=eq." + acct }] } }, ref: "1" }));
      };
      ws.onmessage = (e) => {
        try { const d = JSON.parse(e.data); if (d.event === "postgres_changes" || d.event === "INSERT" || d.event === "UPDATE") check(); } catch {}
      };
      const hb = setInterval(() => { if (ws?.readyState === 1) ws.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: "hb" })); }, 30000);
      return () => { clearInterval(hb); ws?.close(); };
    } catch {
      /* Fallback to polling if WebSocket fails */
      const interval = setInterval(check, 5000);
      return () => clearInterval(interval);
    }
  }, [mounted]);

  /* ═══ EXPORT HELPERS ═══ */
  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPersonnelCSV = () => {
    downloadCSV(`${co?.account_number || "export"}_personnel_${new Date().toISOString().slice(0,10)}.csv`,
      ["Name","Email","Mobile","Clearance","Request Type","Stage","Revalidation Date"],
      ppl.map(p => [p.employee_name, p.email, p.mobile, p.clearance_type, p.clearance_request_type, lbl(p.stage), p.revalidation_date || ""])
    );
  };

  const exportFinancialsCSV = () => {
    const rows: string[][] = [
      ["Application Fees", String(co?.total_application_fees || 0)],
      ["Sponsorship Fees", String(co?.total_sponsorship_fees || 0)],
      ["AGSVA Fees", String(co?.total_agsva_fees || 0)],
      ["AusClear Fees (ex-AGSVA)", String(co?.total_fees_minus_agsva || 0)],
      ["Total Fees", String(co?.total_fees || 0)],
      ["",""],
      ["Promotional Offer", co?.promotional_offer || "None"],
    ];
    downloadCSV(`${co?.account_number || "export"}_financials_${new Date().toISOString().slice(0,10)}.csv`,
      ["Item","Amount"], rows
    );
  };

  const exportAnalyticsCSV = () => {
    const rows: string[][] = [];
    batches.forEach(b => {
      rows.push([b.deal_name, String(b.nominee_count), String(b.app_fees), String(b.sponsor_fees), String(b.agsva_fees), String(b.total_fees), b.promotional_offer || ""]);
    });
    downloadCSV(`${co?.account_number || "export"}_groups_${new Date().toISOString().slice(0,10)}.csv`,
      ["Group","Employees","App Fees","Sponsorship","AGSVA","Total","Promo"], rows
    );
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const acct = sessionStorage.getItem("account_number");
    if (!acct) { router.push("/login"); return; }
    // Check maintenance mode first (skip for admin)
    if (sessionStorage.getItem("admin_impersonate") !== "1") {
      fetch("/api/admin/maintenance-check").then(r => r.json()).then(d => {
        if (d.active) { sessionStorage.removeItem("account_number"); router.push("/maintenance"); return; }
        if (d.banner && d.banner.text) setNotifBanner(d.banner);
      }).catch(() => {});
    }
    fetch(`/api/dashboard/data?account_number=${encodeURIComponent(acct)}`).then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); sessionStorage.removeItem("account_number"); }
        else setData(d);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [router, mounted]);

  /* Session timeout — 15 min idle → warning, 17 min → auto-logout */
  const [showTimeout, setShowTimeout] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const lastActivity = useRef(Date.now());
  const timeoutPref = typeof window !== "undefined" ? parseInt(localStorage.getItem("ausclear_timeout") || "15") : 15;
  const IDLE_WARN = timeoutPref * 60 * 1000;
  const IDLE_LOGOUT = (timeoutPref + 2) * 60 * 1000;

  useEffect(() => {
    if (!mounted) return;
    const resetTimer = () => { lastActivity.current = Date.now(); if (showTimeout) { setShowTimeout(false); setCountdown(120); } };
    const events = ["mousedown","keydown","touchstart","scroll","mousemove"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));

    const tick = setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      if (idle >= IDLE_LOGOUT) {
        clearInterval(tick);
        router.push("/logout");
      } else if (idle >= IDLE_WARN) {
        setShowTimeout(true);
        setCountdown(Math.max(0, Math.ceil((IDLE_LOGOUT - idle) / 1000)));
      }
    }, 1000);

    return () => { clearInterval(tick); events.forEach(e => window.removeEventListener(e, resetTimer)); };
  }, [mounted, showTimeout, router]);

  const co      = data?.company;
  const ppl     = data?.personnel || [];
  const act     = data?.activity  || [];
  const batches = data?.batches   || [];
  const fees    = co ? (co.total_fees || ((co.total_agsva_fees||0) + (co.total_application_fees||0) + (co.total_sponsorship_fees||0))) : 0;
  const accountStage = co?.corp_deal_stage || "Onboard Corporate Account";

  const TABS = [
    { key:"overview"   as const, label:"Overview",          icon:"📋" },
    { key:"batches"    as const, label:"Nominated Groups",  icon:"📁" },
    { key:"personnel"  as const, label:"Personnel",         icon:"👥" },
    { key:"financials" as const, label:"Financials",        icon:"💰" },
    { key:"analytics"  as const, label:"Analytics",         icon:"📊" },
    { key:"messages"   as const, label:"Messages",          icon:"✉️" },
    { key:"account"    as const, label:"My Details",        icon:"🏢" },
    { key:"settings"   as const, label:"Settings",          icon:"⚙️" },
  ];

  const exportPDF = () => {
    const acct = sessionStorage.getItem("account_number") || "";
    window.open(`/api/dashboard/export-pdf?account_number=${encodeURIComponent(acct)}`, "_blank");
  };

  const Overview = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
        <button onClick={exportPDF} style={{ background:C.card, border:`1px solid ${C.line}`, padding:"9px 16px", color:C.muted, fontSize:12, cursor:"pointer", borderRadius:8, transition:"all 0.2s", boxShadow:isDark?"0 2px 6px rgba(0,0,0,0.15)":"0 1px 4px rgba(0,0,0,0.04)" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor=C.gold; e.currentTarget.style.color=C.gold; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=C.line; e.currentTarget.style.color=C.muted; }}>📄 PDF Summary</button>
        <button onClick={exportPersonnelCSV} style={{ background:C.card, border:`1px solid ${C.line}`, padding:"9px 16px", color:C.muted, fontSize:12, cursor:"pointer", borderRadius:8, transition:"all 0.2s", boxShadow:isDark?"0 2px 6px rgba(0,0,0,0.15)":"0 1px 4px rgba(0,0,0,0.04)" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor=C.gold; e.currentTarget.style.color=C.gold; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=C.line; e.currentTarget.style.color=C.muted; }}>📥 Export CSV</button>
      </div>

      {isMobile && (
        <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow 0.2s", borderTop:`2px solid ${C.gold}`, padding:"18px 20px" }}>
          <div style={{ fontSize:22, fontWeight:700, color:C.text, marginBottom:4 }}>{co?.company_name}</div>
          <div style={{ fontSize:12, color:C.muted }}>
            {co?.abn && <span>ABN {co.abn} &nbsp;·&nbsp; </span>}
            Account: <span style={{ color:C.gold, fontFamily:"monospace", fontWeight:700 }}>{co?.account_number || "—"}</span>
          </div>
        </div>
      )}
      {isMobile && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:1, background:C.line }}>
          {[
            { label:"Nominees",  value:co?.total_nominees??0, col:C.text  },
            { label:"Total Fees",value:$k(fees),              col:C.gold  },
            { label:"Baseline",  value:co?.baseline_total??0, col:C.muted },
            { label:"NV1",       value:co?.nv1_total??0,      col:C.blue  },
            { label:"NV2",       value:co?.nv2_total??0,      col:C.gold  },
            { label:"New",       value:co?.new_total??0,      col:C.green },
          ].map((s,i) => (
            <div key={i} style={{ background:C.card, padding:"14px 16px" }}>
              <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase" as const, letterSpacing:"0.14em", marginBottom:6 }}>{s.label}</div>
              <div style={{ fontSize:24, fontWeight:700, color:s.col }}>{typeof s.value === "number" ? <AnimNum value={s.value} /> : s.value}</div>
            </div>
          ))}
        </div>
      )}
      {co?.promotional_offer && (
        <div style={{ background:isDark?"rgba(92,184,122,0.06)":"rgba(45,138,78,0.05)", border:`1px solid ${isDark?"rgba(92,184,122,0.2)":"rgba(45,138,78,0.2)"}`, padding:"14px 18px", display:"flex", alignItems:"center", gap:12, borderRadius:12 }}>
          <span style={{ fontSize:20 }}>🏷️</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.green }}>Promotional Offer Applied</div>
            <div style={{ fontSize:11, color:C.muted }}>{co.promotional_offer} — applied to your nominated group</div>
          </div>
        </div>
      )}
      <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow 0.2s" }}>
        <div style={{ padding:"12px 18px", borderBottom:`1px solid ${C.line}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:13, fontWeight:600, color:C.text }}>Current Group Stage</span>
          <button onClick={() => setTab("batches")} style={{ fontSize:11, color:C.gold, background:"none", border:"none", cursor:"pointer", padding:0 }}>View →</button>
        </div>
        <div style={{ padding:"12px 18px 14px" }}>
          <Chevrons stages={CORP_STAGES} active={accountStage} dark={isDark} />
          {co?.corp_deal_name && (
            <div style={{ marginTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:11, color:C.text, fontWeight:600 }}>{co.corp_deal_name}</span>
              {(co.corp_deal_amount ?? 0) > 0 && <span style={{ fontSize:13, fontWeight:700, color:C.gold, fontFamily:"monospace" }}>{$k(co.corp_deal_amount)}</span>}
            </div>
          )}
        </div>
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow 0.2s" }}>
        <div style={{ padding:"12px 18px", borderBottom:`1px solid ${C.line}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:13, fontWeight:600, color:C.text }}>Personnel ({ppl.length})</span>
          <button onClick={() => setTab("personnel")} style={{ fontSize:11, color:C.gold, background:"none", border:"none", cursor:"pointer", padding:0 }}>View all →</button>
        </div>
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
      </div>
      {act.length > 0 && (
        <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow 0.2s" }}>
          <div style={{ padding:"12px 18px", borderBottom:`1px solid ${C.line}` }}>
            <span style={{ fontSize:13, fontWeight:600, color:C.text }}>Recent Activity</span>
          </div>
          {act.slice(0,5).map((a,i) => (
            <div key={a.id} style={{ display:"flex", gap:12, padding:"10px 18px",
              borderBottom:i<4?`1px solid ${C.line}`:"none", alignItems:"flex-start" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:C.gold, flexShrink:0, marginTop:5 }} />
              <div style={{ flex:1, fontSize:12, color:C.text }}>{a.event}</div>
              <div style={{ fontSize:11, color:C.dim, whiteSpace:"nowrap" as const }}>{$d(a.event_date)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const Batches = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <div style={{ fontSize:11, color:C.gold, textTransform:"uppercase" as const, letterSpacing:"0.2em", marginBottom:4 }}>Nominated Employee Groups</div>
        <div style={{ fontSize:13, color:C.muted }}>{batches.length} group{batches.length !== 1 ? "s" : ""} · {co?.company_name}</div>
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow 0.2s", padding:"14px 18px" }}>
        <div style={{ fontSize:10, color:C.gold, textTransform:"uppercase" as const, letterSpacing:"0.15em", fontWeight:700, marginBottom:8 }}>Current Group Stage</div>
        <Chevrons stages={CORP_STAGES} active={accountStage} dark={isDark} />
      </div>
      {batches.map((batch) => {
        const bOpen = expandedB === batch.id;
        return (
          <div key={batch.id} style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow 0.2s", borderTop:`2px solid ${C.gold}` }}>
            <div onClick={() => setExpandedB(bOpen ? null : batch.id)}
              style={{ padding:"14px 18px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" as const }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = C.card2}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{batch.deal_name}</div>
                <div style={{ fontSize:11, color:C.muted, display:"flex", gap:12, flexWrap:"wrap" as const }}>
                  <span>Stage: <span style={{ color:C.gold, fontWeight:600 }}>{lbl(batch.stage)}</span></span>
                  <span>Created: <span style={{ color:C.text }}>{$d(batch.created_time)}</span></span>
                  <span>{batch.nominee_count} employee{batch.nominee_count !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div style={{ display:"flex", gap:12, alignItems:"center", flexShrink:0 }}>
                <div style={{ fontSize:18, fontWeight:700, color:C.gold, fontFamily:"monospace" }}>{$k(batch.amount)}</div>
                <span style={{ color:C.dim, fontSize:16, display:"inline-block", transform:bOpen?"rotate(90deg)":"rotate(0deg)", transition:"transform 0.2s" }}>›</span>
              </div>
            </div>
            {bOpen && (
              <div style={{ borderTop:`1px solid ${C.line}` }}>
                <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.line}`, background:C.side }}>
                  <div style={{ fontSize:10, color:C.gold, textTransform:"uppercase" as const, letterSpacing:"0.15em", fontWeight:700, marginBottom:12 }}>Group Financials</div>
                  {batch.promotional_offer && (
                    <div style={{ background:"rgba(92,184,122,0.1)", border:"1px solid rgba(92,184,122,0.3)", borderRadius:6, padding:"8px 12px", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:14 }}>🏷</span>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:C.green }}>Promotional Offer Applied</div>
                        <div style={{ fontSize:11, color:C.muted }}>{batch.promotional_offer} {(batch.discount || 0) > 0 && `(−$${(batch.discount || 0).toLocaleString()} total)`}</div>
                      </div>
                    </div>
                  )}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:1, background:C.line, marginBottom:12 }}>
                    {[
                      { label:"Application Fees", value:$k(batch.app_fees),    note:(batch.discount || 0) > 0 ? `$410 − $${batch.discount} promo` : `${batch.nominee_count} employee${batch.nominee_count !== 1 ? "s" : ""}` },
                      { label:"Sponsorship Fees", value:$k(batch.sponsor_fees),note:"$1,400 per employee" },
                      { label:"AGSVA Fees",        value:$k(batch.agsva_fees),  note:"Government at cost" },
                      { label:"Total",             value:$k(batch.total_fees),  note:"All fees incl. GST" },
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
                    {batch.nv1_count      > 0 && <span style={{ fontSize:11, color:C.muted }}>NV1: <strong style={{ color:C.blue }}>{batch.nv1_count}</strong></span>}
                    {batch.nv2_count      > 0 && <span style={{ fontSize:11, color:C.muted }}>NV2: <strong style={{ color:C.gold }}>{batch.nv2_count}</strong></span>}
                    {batch.new_count      > 0 && <span style={{ fontSize:11, color:C.muted }}>New: <strong style={{ color:C.green }}>{batch.new_count}</strong></span>}
                    {batch.upgrade_count  > 0 && <span style={{ fontSize:11, color:C.muted }}>Upgrades: <strong style={{ color:C.amber }}>{batch.upgrade_count}</strong></span>}
                  </div>
                </div>
                <div style={{ padding:"10px 18px 4px", borderBottom:`1px solid ${C.line}` }}>
                  <div style={{ fontSize:10, color:C.gold, textTransform:"uppercase" as const, letterSpacing:"0.15em", fontWeight:700 }}>Employees in This Group</div>
                </div>
                {/* Horizontal subform table */}
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" as const }}>
                    <thead>
                      <tr style={{ background:C.side }}>
                        {["Name","Clearance","Request Type","Stage","Onboarding","Submission Date"].map(h => (
                          <th key={h} style={{ padding:"8px 14px", textAlign:"left" as const, fontSize:10,
                            fontWeight:700, color:C.gold, textTransform:"uppercase" as const,
                            letterSpacing:"0.1em", borderBottom:`1px solid ${C.line}`,
                            whiteSpace:"nowrap" as const }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {batch.nominees.map((p, pi) => (
                        <tr key={p.id}
                          style={{ borderBottom: pi < batch.nominees.length-1 ? `1px solid ${C.line}` : "none", transition:"background 0.15s" }}
                          onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.card2}
                          onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                          <td style={{ padding:"11px 14px", whiteSpace:"nowrap" as const }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ width:28, height:28, borderRadius:"50%", background:isDark?"rgba(201,168,76,0.1)":"rgba(37,99,176,0.08)", border:`1px solid ${isDark?"rgba(201,168,76,0.2)":"rgba(37,99,176,0.15)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:C.gold, flexShrink:0 }}>{p.employee_name.split(" ").map((w:string)=>w[0]).join("").slice(0,2)}</div>
                              <span style={{ color:C.text, fontWeight:600 }}>{p.employee_name}</span>
                            </div>
                          </td>
                          <td style={{ padding:"11px 14px", whiteSpace:"nowrap" as const }}><Pill t={clrTag(p.clearance_type)} /></td>
                          <td style={{ padding:"11px 14px", color:C.muted, whiteSpace:"nowrap" as const }}>{p.clearance_request_type || "New"}</td>
                          <td style={{ padding:"11px 14px", color:C.muted, whiteSpace:"nowrap" as const }}>{lbl(p.stage) || "—"}</td>
                          <td style={{ padding:"11px 14px", color:C.muted, whiteSpace:"nowrap" as const }}>{lbl(p.onboarding_status) || "—"}</td>
                          <td style={{ padding:"11px 14px", color:C.muted, whiteSpace:"nowrap" as const }}>{$d(p.batch_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const Personnel = () => (
    <div>
      <div style={{ marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:20, fontWeight:700, color:C.text }}>
          Personnel <span style={{ fontSize:14, color:C.muted, fontWeight:400 }}>({ppl.length})</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={exportPersonnelCSV} style={{ background:"transparent", border:`1px solid ${C.line}`, padding:"9px 14px", color:C.muted, fontSize:12, cursor:"pointer", borderRadius:4 }}>📥 Export</button>
          <button onClick={() => setShowNominate(true)} style={{ background:C.gold, border:"none", padding:"9px 18px", color:C.bg, fontWeight:700, fontSize:12, cursor:"pointer", borderRadius:4 }}>+ Nominate</button>
        </div>
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow 0.2s" }}>
        {ppl.length === 0 && <div style={{ padding:40, textAlign:"center" as const, color:C.dim }}>No personnel nominated.</div>}
        {ppl.map((p,i) => {
          const open = expandedP === p.id;
          const t = clrTag(p.clearance_type);
          return (
            <div key={p.id} style={{ borderBottom:i<ppl.length-1?`1px solid ${C.line}`:"none" }}>
              <div onClick={() => setExpandedP(open ? null : p.id)}
                style={{ display:"flex", gap:14, alignItems:"center", padding:"16px 20px", cursor:"pointer", background:open?C.card2:"transparent", transition:"background 0.2s" }}
                onMouseEnter={e => { if(!open)(e.currentTarget as HTMLDivElement).style.background = C.card2; }}
                onMouseLeave={e => { if(!open)(e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0, background:isDark?"rgba(201,168,76,0.1)":"rgba(37,99,176,0.08)", border:`1px solid ${isDark?"rgba(201,168,76,0.2)":"rgba(37,99,176,0.15)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:C.gold }}>{p.employee_name.split(" ").map((w:string)=>w[0]).join("").slice(0,2)}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text, letterSpacing:"-0.01em" }}>{p.employee_name}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:3, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                    {lbl(p.stage) || "—"}
                    {p.onboarding_status==="Awaiting Application Form" && <span style={{ fontSize:9, fontWeight:700, color:C.amber, background:"rgba(212,147,92,0.15)", border:"1px solid rgba(212,147,92,0.35)", padding:"1px 7px", borderRadius:3 }}>AWAITING APPLICATION FORM</span>}
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                  <Pill t={t} />
                  {p.clearance_request_type && <span style={{ fontSize:10, fontWeight:600, color:C.muted, background:"rgba(122,122,130,0.12)", border:`1px solid rgba(122,122,130,0.3)`, padding:"2px 7px", borderRadius:3 }}>{p.clearance_request_type}</span>}
                  <span style={{ color:C.dim, fontSize:18, display:"inline-block", transform:open?"rotate(90deg)":"rotate(0deg)", transition:"transform 0.25s ease" }}>›</span>
                </div>
              </div>
              {open && (
                <div style={{ background:C.card2, borderTop:`1px solid ${C.line}`, padding:"24px 20px 28px", animation:"fadeIn 0.3s ease" }}>
                  {/* Horizontal clearance status */}
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:10, color:C.gold, textTransform:"uppercase" as const, letterSpacing:"0.12em", fontWeight:700, marginBottom:14 }}>Clearance Status</div>
                    {(() => {
                      const currentIdx = EMP_STAGES.indexOf(p.stage);
                      const activeM = EMP_MILESTONES.findIndex(m => m.stages.includes(p.stage));
                      const pct = currentIdx >= 0 ? Math.round((currentIdx / (EMP_STAGES.length - 1)) * 100) : 0;

                      return (
                        <>
                          <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
                            {EMP_MILESTONES.map((m, mi) => {
                              const isDone = mi < activeM;
                              const isActive = mi === activeM;
                              return (
                                <React.Fragment key={mi}>
                                  <div style={{ display:"flex", flexDirection:"column" as const, alignItems:"center", minWidth:0 }}>
                                    <div style={{
                                      width:isActive?24:16, height:isActive?24:16, borderRadius:"50%", flexShrink:0,
                                      background:isDone?C.green:isActive?C.gold:"transparent",
                                      border:isDone?"none":isActive?"none":`2px solid ${C.line}`,
                                      display:"flex", alignItems:"center", justifyContent:"center",
                                      fontSize:isActive?11:9, color:isDone||isActive?"#fff":C.dim, fontWeight:700,
                                      boxShadow:isActive?`0 0 12px ${C.gold}44`:"none",
                                      transition:"all 0.3s",
                                    }}>{isDone?"✓":isActive?(mi+1):mi+1}</div>
                                    <div style={{ fontSize:10, marginTop:6, color:isActive?C.gold:isDone?C.text:C.dim, fontWeight:isActive?700:400, whiteSpace:"nowrap" as const }}>{m.label}</div>
                                  </div>
                                  {mi < EMP_MILESTONES.length - 1 && (
                                    <div style={{ flex:1, height:3, background:isDone?C.green:mi===activeM?`linear-gradient(90deg, ${C.gold}, ${C.line})`:C.line, margin:"0 6px", borderRadius:2, marginBottom:20 }} />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                          {/* Current stage detail */}
                          <div style={{ background:isDark?`${C.gold}0a`:`${C.gold}08`, border:`1px solid ${C.gold}22`, borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <div>
                              <div style={{ fontSize:10, color:C.muted, marginBottom:2 }}>Current Stage</div>
                              <div style={{ fontSize:14, fontWeight:700, color:C.gold }}>{lbl(p.stage) || "Pending"}</div>
                            </div>
                            <div style={{ textAlign:"right" as const }}>
                              <div style={{ fontSize:22, fontWeight:700, color:C.gold }}>{pct}%</div>
                              <div style={{ fontSize:10, color:C.muted }}>complete</div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Employee details grid */}
                  <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:"12px", marginBottom:20 }}>
                    {[
                      { label:"Email",           value:p.email || "—", icon:"✉" },
                      { label:"Mobile",          value:p.mobile || "—", icon:"📱" },
                      { label:"Clearance Level", value:p.clearance_type || "—", icon:"🛡" },
                      { label:"Request Type",    value:p.clearance_request_type || "New", icon:"📝" },
                      { label:"Current Stage",   value:lbl(p.stage) || "—", icon:"📍" },
                      { label:"Onboarding",      value:lbl(p.onboarding_status) || "—", icon:"✅" },
                      { label:"Submission Date", value:$d(p.batch_date), icon:"📅" },
                      { label:"Revalidation",    value:$d(p.revalidation_date), icon:"🔄" },
                    ].map((row, ri) => (
                      <div key={ri} style={{ display:"flex", gap:10, alignItems:"center", background:isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.015)", border:`1px solid ${C.line}`, borderRadius:8, padding:"10px 14px" }}>
                        <span style={{ fontSize:16, flexShrink:0 }}>{row.icon}</span>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase" as const, letterSpacing:"0.1em", fontWeight:600 }}>{row.label}</div>
                          <div style={{ fontSize:13, color:row.value==="—"?C.dim:C.text, fontWeight:600, marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{row.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cost estimate */}
                  <div style={{ background:isDark?"rgba(201,168,76,0.05)":"rgba(37,99,176,0.04)", border:`1px solid ${C.line}`, borderRadius:8, padding:16 }}>
                    <div style={{ fontSize:10, color:C.gold, textTransform:"uppercase" as const, letterSpacing:"0.12em", fontWeight:700, marginBottom:12 }}>Cost Estimate</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
                      {(() => {
                        const rt = p.clearance_request_type || "New";
                        let appFee = rt === "Upgrade" ? 360 : rt === "Transfer" ? 260 : 410;
                        const promo = co?.promotional_offer || "";
                        if (promo && rt !== "Upgrade" && rt !== "Transfer") {
                          const match = promo.match(/\$(\d+)/);
                          if (match) appFee = Math.max(0, appFee - parseInt(match[1]));
                        }
                        const agsva = rt === "Transfer" ? 0 : p.clearance_type?.includes("NV2") ? 3790 : p.clearance_type?.includes("NV1") ? 1897 : 892;
                        return [
                          { label:"Application", value:appFee },
                          { label:"Sponsorship", value:1400 },
                          { label:"AGSVA", value:agsva },
                          { label:"Total", value:appFee + 1400 + agsva, bold:true },
                        ].map((f, fi) => (
                          <div key={fi} style={{ background:f.bold ? (isDark?"rgba(201,168,76,0.08)":"rgba(37,99,176,0.06)") : C.card, border:`1px solid ${f.bold ? C.gold+"33" : C.line}`, borderRadius:8, padding:"14px 12px", textAlign:"center" as const }}>
                            <div style={{ fontSize:11, color:C.muted, marginBottom:4, fontWeight:500 }}>{f.label}</div>
                            <div style={{ fontSize:f.bold ? 22 : 18, fontWeight:700, color:f.bold ? C.gold : C.text, letterSpacing:"-0.02em" }}>${f.value.toLocaleString()}</div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const Financials = () => {
    const [payData, setPayData]   = useState<any>(null);
    const [payLoad, setPayLoad]   = useState(true);
    const [payErr, setPayErr]     = useState("");
    const [booksData, setBooksData] = useState<any>(null);
    const [invOpen, setInvOpen]   = useState<string|null>(null);

    useEffect(() => {
      const acct = sessionStorage.getItem("account_number");
      if (!acct) return;
      const name = co?.company_name || "";
      // Fetch both GoCardless payments and Books invoices
      Promise.all([
        fetch(`/api/dashboard/payments?account_number=${encodeURIComponent(acct)}`).then(r => r.json()).catch(() => null),
        name ? fetch(`/api/dashboard/books?company_name=${encodeURIComponent(name)}`).then(r => r.json()).catch(() => null) : Promise.resolve(null),
      ]).then(([pay, books]) => {
        if (pay && !pay.error) setPayData(pay);
        if (books && !books.error) setBooksData(books);
      }).finally(() => setPayLoad(false));
    }, []);

    if (payLoad) return <div style={{ textAlign:"center", padding:40, color:C.muted }}>Loading payments…</div>;

    const fmt$ = (v: string|number) => `$${Number(v).toLocaleString("en-AU", { minimumFractionDigits:2 })}`;
    const fmtDate = (d: string) => { try { return new Date(d+"T00:00:00").toLocaleDateString("en-AU", { day:"numeric", month:"short", year:"numeric" }); } catch { return d; } };

    return (
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <button onClick={exportFinancialsCSV} style={{ background:"transparent", border:`1px solid ${C.line}`, padding:"9px 14px", color:C.muted, fontSize:12, cursor:"pointer", borderRadius:4 }}>📥 Export</button>
        </div>
        {co?.promotional_offer && (
          <div style={{ background:"rgba(92,184,122,0.08)", border:"1px solid rgba(92,184,122,0.25)", padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:18 }}>🏷️</span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.green }}>Promotional Offer Applied</div>
              <div style={{ fontSize:11, color:C.muted }}>{co.promotional_offer} — reflected in your group totals</div>
            </div>
          </div>
        )}
        <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow 0.2s", borderTop:`2px solid ${C.gold}`, padding:"20px 22px" }}>
          <div style={{ fontSize:11, color:C.gold, textTransform:"uppercase" as const, letterSpacing:"0.2em", marginBottom:4 }}>Total Fees</div>
          <div style={{ fontSize:38, fontWeight:700, color:C.text }}>{$k(fees)}</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{co?.total_nominees||0} sponsored employees</div>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow 0.2s" }}>
          {[
            { label:"Application Fees",        value:co?.total_application_fees,  note:co?.promotional_offer ? `$410 − ${co.promotional_offer}` : `${co?.total_nominees||0} × $410` },
            { label:"Year 1 Sponsorship",       value:co?.total_sponsorship_fees,  note:"$1,400 per employee" },
            { label:"AGSVA Pass-Through",       value:co?.total_agsva_fees,        note:"Government vetting at cost" },
            { label:"AusClear Fees (ex-AGSVA)", value:co?.total_fees_minus_agsva,  note:"App + Sponsorship" },
          ].map((row,i,arr) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px", borderBottom:i<arr.length-1?`1px solid ${C.line}`:"none" }}>
              <div>
                <div style={{ fontSize:13, color:C.text }}>{row.label}</div>
                <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{row.note}</div>
              </div>
              <div style={{ fontSize:15, fontWeight:700, color:C.gold, fontFamily:"monospace" }}>{$k(row.value)}</div>
            </div>
          ))}
        </div>

        {/* ── Zoho Books — Real Invoices ── */}
        {booksData && booksData.invoices?.length > 0 && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)", gap:1, background:C.line, marginTop:12 }}>
              <div style={{ background:C.card, padding:"14px 16px" }}>
                <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase" as const, letterSpacing:"0.12em", marginBottom:6 }}>Total Invoiced</div>
                <div style={{ fontSize:24, fontWeight:700, color:C.text }}>{fmt$(booksData.summary.totalInvoiced)}</div>
              </div>
              <div style={{ background:C.card, padding:"14px 16px" }}>
                <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase" as const, letterSpacing:"0.12em", marginBottom:6 }}>Paid</div>
                <div style={{ fontSize:24, fontWeight:700, color:C.green }}>{fmt$(booksData.summary.totalPaid)}</div>
              </div>
              <div style={{ background:C.card, padding:"14px 16px" }}>
                <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase" as const, letterSpacing:"0.12em", marginBottom:6 }}>Outstanding</div>
                <div style={{ fontSize:24, fontWeight:700, color:booksData.summary.totalOutstanding > 0 ? C.amber : C.green }}>{fmt$(booksData.summary.totalOutstanding)}</div>
              </div>
            </div>

            <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow 0.2s", marginTop:8 }}>
              <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.line}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Invoices</div>
                  <div style={{ fontSize:11, color:C.dim }}>{booksData.invoices.length} invoice{booksData.invoices.length !== 1 ? "s" : ""} </div>
                </div>
              </div>
              {booksData.invoices.map((inv: any, i: number) => {
                const statusCol = inv.status === "paid" ? C.green : inv.status === "overdue" ? C.red : inv.status === "sent" ? C.amber : inv.status === "partially_paid" ? "#d4935c" : C.muted;
                return (
                  <div key={inv.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 18px", borderBottom:i < booksData.invoices.length - 1 ? `1px solid ${C.line}` : "none" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{inv.number}</div>
                        <div style={{ fontSize:10, padding:"2px 8px", borderRadius:4, background:`${statusCol}18`, color:statusCol, fontWeight:600, textTransform:"capitalize" as const }}>{inv.status?.replace("_", " ")}</div>
                      </div>
                      <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{fmtDate(inv.date)}{inv.due_date ? ` · Due ${fmtDate(inv.due_date)}` : ""}</div>
                    </div>
                    <div style={{ textAlign:"right" as const }}>
                      <div style={{ fontSize:15, fontWeight:700, color:C.gold, fontFamily:"monospace" }}>{fmt$(inv.total)}</div>
                      {inv.balance > 0 && inv.balance !== inv.total && <div style={{ fontSize:11, color:C.amber }}>Bal: {fmt$(inv.balance)}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Live payment data (only if API returned successfully) ── */}
        {payData && <>
        {/* ── Payment type ── */}
        <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow 0.2s", padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8 }}>
          <div style={{ fontSize:13, color:C.text }}>Payment Method</div>
          <div style={{ fontSize:12, padding:"4px 12px", borderRadius:4, background: payData.paymentPreference === 'Upfront' ? 'rgba(92,184,122,0.12)' : payData.paymentPreference === 'Direct Debit' ? 'rgba(201,168,76,0.12)' : 'rgba(122,122,130,0.12)', color: payData.paymentPreference === 'Upfront' ? C.green : payData.paymentPreference === 'Direct Debit' ? C.gold : C.muted, fontWeight:600 }}>
            {payData.paymentPreference === 'Upfront' ? 'Single Payment' : payData.paymentPreference === 'Direct Debit' ? 'Quarterly Instalments (4 payments)' : payData.paymentPreference}
          </div>
        </div>
        {/* ── Summary cards ── */}
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)", gap:1, background:C.line, marginTop:8 }}>
          <div style={{ background:C.card, padding:"14px 16px" }}>
            <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase" as const, letterSpacing:"0.12em", marginBottom:6 }}>Total Paid</div>
            <div style={{ fontSize:24, fontWeight:700, color:C.green }}>{fmt$(payData.summary.totalPaid)}</div>
          </div>
          <div style={{ background:C.card, padding:"14px 16px" }}>
            <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase" as const, letterSpacing:"0.12em", marginBottom:6 }}>Outstanding</div>
            <div style={{ fontSize:24, fontWeight:700, color:Number(payData.summary.totalOutstanding)>0?C.amber:C.green }}>{fmt$(payData.summary.totalOutstanding)}</div>
          </div>
          <div style={{ background:C.card, padding:"14px 16px" }}>
            <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase" as const, letterSpacing:"0.12em", marginBottom:6 }}>Next Debit</div>
            {payData.summary.nextDebit ? (
              <>
                <div style={{ fontSize:20, fontWeight:700, color:C.text }}>{fmt$(payData.summary.nextDebit.amount)}</div>
                <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{fmtDate(payData.summary.nextDebit.date)}</div>
              </>
            ) : <div style={{ fontSize:14, color:C.dim }}>None scheduled</div>}
          </div>
        </div>

        {/* ── Upcoming direct debits ── */}
        {payData.upcoming.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow 0.2s", marginTop:8 }}>
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.line}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Upcoming Direct Debits</div>
            </div>
            {payData.upcoming.map((u: any, i: number) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 18px", borderBottom:i<payData.upcoming.length-1?`1px solid ${C.line}`:"none" }}>
                <div>
                  <div style={{ fontSize:13, color:C.text }}>{u.name}</div>
                  <div style={{ fontSize:11, color:C.dim }}>{fmtDate(u.date)}</div>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:C.gold, fontFamily:"monospace" }}>{fmt$(u.amount)}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Invoices ── */}
        {payData.invoices.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow 0.2s", marginTop:8 }}>
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.line}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Invoices</div>
              <div style={{ fontSize:11, color:C.dim }}>{payData.invoices.length} invoice{payData.invoices.length!==1?"s":""}</div>
            </div>
            {payData.invoices.map((inv: any) => (
              <div key={inv.id}>
                <div onClick={() => setInvOpen(invOpen===inv.id?null:inv.id)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 18px", borderBottom:`1px solid ${C.line}`, cursor:"pointer", transition:"background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.card2)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{inv.number}</div>
                      <div style={{ fontSize:10, padding:"2px 8px", borderRadius:4, background:`${inv.colour}18`, color:inv.colour, fontWeight:600 }}>{inv.status}</div>
                    </div>
                    <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{fmtDate(inv.date)}{inv.dueDate ? ` · Due ${fmtDate(inv.dueDate)}` : ""}</div>
                  </div>
                  <div style={{ textAlign:"right" as const }}>
                    <div style={{ fontSize:15, fontWeight:700, color:C.gold, fontFamily:"monospace" }}>{fmt$(inv.total)}</div>
                    {inv.balance > 0 && inv.balance !== inv.total && <div style={{ fontSize:11, color:C.amber }}>Bal: {fmt$(inv.balance)}</div>}
                  </div>
                </div>
                {invOpen===inv.id && inv.lineItems?.length > 0 && (
                  <div style={{ background:C.card2, padding:"8px 18px 12px 32px", borderBottom:`1px solid ${C.line}` }}>
                    {inv.lineItems.map((li: any, j: number) => (
                      <div key={j} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", fontSize:12 }}>
                        <div style={{ color:C.muted, flex:1 }}>{li.description}</div>
                        <div style={{ color:C.text, fontFamily:"monospace", marginLeft:12 }}>{fmt$(li.amount)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Payment history ── */}
        {payData.payments.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow 0.2s", marginTop:8 }}>
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.line}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Payment History</div>
              <div style={{ fontSize:11, color:C.dim }}>{payData.payments.length} payment{payData.payments.length!==1?"s":""} via Direct Debit</div>
            </div>
            {payData.payments.slice(0, 20).map((p: any, i: number) => (
              <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 18px", borderBottom:i<Math.min(payData.payments.length,20)-1?`1px solid ${C.line}`:"none" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ fontSize:13, color:C.text }}>{fmtDate(p.date)}</div>
                    <div style={{ fontSize:10, padding:"2px 8px", borderRadius:4, background:`${p.colour}18`, color:p.colour, fontWeight:600 }}>{p.status}</div>
                  </div>
                  {p.description && <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{p.description}</div>}
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text, fontFamily:"monospace" }}>{fmt$(p.amount)}</div>
              </div>
            ))}
            {payData.payments.length > 20 && (
              <div style={{ padding:"10px 18px", fontSize:11, color:C.dim, textAlign:"center" as const }}>
                Showing 20 of {payData.payments.length} payments
              </div>
            )}
          </div>
        )}

        {!payData.hasDirectDebit && payData.invoices.length === 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow 0.2s", padding:"30px 20px", textAlign:"center" as const, marginTop:8 }}>
            <div style={{ fontSize:14, color:C.muted }}>No payment data found for this account</div>
            <div style={{ fontSize:12, color:C.dim, marginTop:6 }}>Contact support@ausclear.com.au for billing enquiries</div>
          </div>
        )}
        </>}
      </div>
    );
  };

  /* ═══ SHARED COMPONENTS ═══ */
  const SCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow 0.2s", marginBottom:16, overflow:"hidden" }}>
      <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.line}`, background:C.goldD }}>
        <span style={{ fontSize:13, fontWeight:700, color:C.gold, letterSpacing:"0.05em" }}>{title}</span>
      </div>
      <div style={{ padding:20 }}>{children}</div>
    </div>
  );

  const EditSection = ({ fields }: { fields: { key: string; label: string; value?: string | null }[] }) => {
    const [editing, setEditing] = useState(false);
    const [values, setValues] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const startEdit = () => {
      const v: Record<string, string> = {};
      fields.forEach(f => { v[f.key] = f.value || ""; });
      setValues(v);
      setEditing(true);
      setMsg(null);
    };

    const save = async () => {
      setSaving(true); setMsg(null);
      try {
        const acct = sessionStorage.getItem("account_number") || "";
        const updates: Record<string, string> = {};
        fields.forEach(f => {
          let val = values[f.key] || "";
          // Strip "Other:" prefix from job title custom entries
          if (f.key.includes("job_title") && val.startsWith("Other:")) val = val.replace("Other:", "").trim();
          if (val !== (f.value || "")) updates[f.key] = val;
        });
        if (Object.keys(updates).length === 0) { setEditing(false); setSaving(false); return; }
        const res = await fetch("/api/dashboard/update-account", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ account_number: acct, updates }),
        });
        const d = await res.json();
        if (d.ok) {
          setMsg({ ok: true, text: "Saved" });
          setEditing(false);
          fetch(`/api/dashboard/data?account_number=${encodeURIComponent(acct)}&_t=${Date.now()}`).then(r => r.json()).then(dd => { if (!dd.error) setData(dd); });
        } else setMsg({ ok: false, text: d.error || "Save failed" });
      } catch { setMsg({ ok: false, text: "Something went wrong" }); }
      setSaving(false);
    };

    return (
      <div style={{ marginBottom: 8 }}>
        {fields.map((f, i) => (
          <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < fields.length - 1 ? `1px solid ${C.line}` : "none" }}>
            <span style={{ fontSize: 12, color: C.muted, flexShrink: 0, marginRight: 12 }}>{f.label}</span>
            {editing ? (
              f.key.includes("job_title") ? (
                <div style={{ flex: 1, maxWidth: "60%", display: "flex", flexDirection: "column" as const, gap: 4 }}>
                  <select value={values[f.key]?.startsWith("Other:") ? "Other" : (values[f.key] || "")}
                    onChange={e => { const v = e.target.value; setValues(prev => ({ ...prev, [f.key]: v === "Other" ? "Other:" : v })); }}
                    style={{ padding: "8px 12px", background: "#fff", border: `2px solid ${C.gold}66`, borderRadius: 6, color: "#000", fontSize: 13, outline: "none", fontWeight: 500, WebkitTextFillColor: "#000", appearance: "auto" as const }}>
                    <option value="">-Select-</option>
                    <optgroup label="Executive">
                      <option>Managing Director</option>
                      <option>Director</option>
                      <option>CEO</option>
                      <option>CFO</option>
                      <option>COO</option>
                      <option>CTO</option>
                      <option>CIO</option>
                      <option>CISO</option>
                      <option>Company Secretary</option>
                    </optgroup>
                    <optgroup label="Management">
                      <option>General Manager</option>
                      <option>Operations Manager</option>
                      <option>HR Manager</option>
                      <option>Security Manager</option>
                      <option>IT Manager</option>
                      <option>Finance Manager</option>
                      <option>Accounts Manager</option>
                      <option>Administration Manager</option>
                      <option>Office Manager</option>
                      <option>Project Manager</option>
                      <option>Program Manager</option>
                      <option>Business Manager</option>
                      <option>Contracts Manager</option>
                      <option>Compliance Manager</option>
                      <option>Risk Manager</option>
                      <option>Procurement Manager</option>
                      <option>Logistics Manager</option>
                      <option>Facilities Manager</option>
                      <option>Branch Manager</option>
                      <option>Regional Manager</option>
                    </optgroup>
                    <optgroup label="Security &amp; Defence">
                      <option>Facility Security Officer</option>
                      <option>Security Officer</option>
                      <option>Security Adviser</option>
                      <option>Security Consultant</option>
                      <option>Defence Liaison</option>
                    </optgroup>
                    <optgroup label="Professional">
                      <option>Engineer</option>
                      <option>Senior Engineer</option>
                      <option>Principal Engineer</option>
                      <option>Analyst</option>
                      <option>Senior Analyst</option>
                      <option>Consultant</option>
                      <option>Senior Consultant</option>
                      <option>Adviser</option>
                      <option>Architect</option>
                      <option>Technician</option>
                      <option>Specialist</option>
                    </optgroup>
                    <optgroup label="Administration">
                      <option>Executive Assistant</option>
                      <option>Personal Assistant</option>
                      <option>Office Administrator</option>
                      <option>Administration Officer</option>
                      <option>Receptionist</option>
                      <option>Coordinator</option>
                      <option>HR Officer</option>
                      <option>Payroll Officer</option>
                      <option>Accounts Officer</option>
                    </optgroup>
                    <optgroup label="Construction &amp; Trades">
                      <option>Construction Manager</option>
                      <option>Site Manager</option>
                      <option>Site Supervisor</option>
                      <option>Site Engineer</option>
                      <option>Foreman</option>
                      <option>Project Engineer</option>
                      <option>Quantity Surveyor</option>
                      <option>Estimator</option>
                      <option>Surveyor</option>
                      <option>Building Manager</option>
                      <option>Works Manager</option>
                      <option>Maintenance Manager</option>
                      <option>Workshop Manager</option>
                      <option>Plant Manager</option>
                      <option>Safety Manager</option>
                      <option>WHS Manager</option>
                      <option>WHS Officer</option>
                      <option>Quality Manager</option>
                      <option>Quality Assurance Manager</option>
                      <option>Environmental Manager</option>
                      <option>Drafting Manager</option>
                      <option>Draftsperson</option>
                      <option>Electrician</option>
                      <option>Plumber</option>
                      <option>Fitter</option>
                      <option>Welder</option>
                      <option>Boilermaker</option>
                      <option>Carpenter</option>
                      <option>Painter</option>
                      <option>Labourer</option>
                      <option>Apprentice</option>
                      <option>Trade Assistant</option>
                    </optgroup>
                    <optgroup label="IT &amp; Cyber">
                      <option>IT Administrator</option>
                      <option>Systems Administrator</option>
                      <option>Network Engineer</option>
                      <option>Software Developer</option>
                      <option>Cyber Security Analyst</option>
                      <option>Data Analyst</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option>Owner</option>
                      <option>Partner</option>
                      <option>Sole Trader</option>
                      <option>Contractor</option>
                      <option>Subcontractor</option>
                      <option value="Other">Other (specify)</option>
                    </optgroup>
                  </select>
                  {(values[f.key] || "").startsWith("Other:") && (
                    <input value={(values[f.key] || "").replace("Other:", "")} placeholder="Enter job title"
                      onChange={e => setValues(prev => ({ ...prev, [f.key]: "Other:" + e.target.value }))}
                      style={{ padding: "8px 12px", background: isDark ? "#1a1f2e" : "#fff", border: `2px solid ${C.gold}66`, borderRadius: 6, color: isDark ? "#e8e6e1" : "#1a1a2e", fontSize: 13, outline: "none", textAlign: "right" as const, fontWeight: 500, WebkitTextFillColor: isDark ? "#e8e6e1" : "#1a1a2e" }} />
                  )}
                </div>
              ) : (
              <input value={values[f.key] || ""} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                style={{ flex: 1, maxWidth: "60%", padding: "8px 12px", background: isDark ? "#1a1f2e" : "#fff", border: `2px solid ${C.gold}66`, borderRadius: 6, color: isDark ? "#e8e6e1" : "#1a1a2e", fontSize: 13, outline: "none", textAlign: "right" as const, boxSizing: "border-box" as const, fontWeight: 500, WebkitTextFillColor: isDark ? "#e8e6e1" : "#1a1a2e" }} />
              )
            ) : (
              <span style={{ fontSize: 12, color: C.text, fontWeight: 500, textAlign: "right" as const, maxWidth: "60%", wordBreak: "break-word" as const }}>{f.value || "—"}</span>
            )}
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
          {msg && <span style={{ fontSize: 11, color: msg.ok ? "#5cb87a" : C.red, alignSelf: "center", marginRight: "auto" }}>{msg.text}</span>}
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setMsg(null); }} style={{ padding: "7px 16px", border: `1px solid ${C.line}`, background: "transparent", borderRadius: 5, color: C.muted, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding: "7px 16px", border: "none", background: C.gold, borderRadius: 5, color: isDark ? "#07070a" : "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{saving ? "Saving..." : "Save"}</button>
            </>
          ) : (
            <button onClick={startEdit} style={{ padding: "7px 16px", border: `1px solid ${C.line}`, background: "transparent", borderRadius: 5, color: C.gold, fontSize: 12, cursor: "pointer" }}>Edit</button>
          )}
        </div>
      </div>
    );
  };

  /* ═══ SETTINGS ═══ */
  const Settings = () => {
    const [curPin, setCurPin] = useState("");
    const [newPin, setNewPin] = useState("");
    const [confPin, setConfPin] = useState("");
    const [pinMsg, setPinMsg] = useState<{ok:boolean;text:string}|null>(null);
    const [pinLoading, setPinLoading] = useState(false);
    const [timeoutMin, setTimeoutMin] = useState(() => {
      if (typeof window !== "undefined") return parseInt(localStorage.getItem("ausclear_timeout") || "15");
      return 15;
    });

    const pinsMatch = newPin.length === 6 && newPin === confPin;

    const handleChangePin = async () => {
      if (!pinsMatch || curPin.length !== 6) return;
      setPinLoading(true); setPinMsg(null);
      try {
        const acct = sessionStorage.getItem("account_number") || "";
        const res = await fetch("/api/auth/change-pin", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ account_number: acct, current_pin: curPin, new_pin: newPin }),
        });
        const data = await res.json();
        if (data.ok) { setPinMsg({ ok: true, text: "PIN changed successfully" }); setCurPin(""); setNewPin(""); setConfPin(""); }
        else setPinMsg({ ok: false, text: data.error || "Failed" });
      } catch { setPinMsg({ ok: false, text: "Something went wrong" }); }
      setPinLoading(false);
    };

    const pinInput = (val: string, set: (v:string)=>void, label: string, highlight?: boolean) => (
      <div style={{ marginBottom: 14 }}>
        <label style={{ display:"block", fontSize:11, color:C.muted, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.1em" }}>{label}</label>
        <input value={val} onChange={e => { if (/^\d{0,6}$/.test(e.target.value)) set(e.target.value); }}
          type="text" inputMode="numeric" maxLength={6}
          style={{ width:"100%", padding:"10px 12px", background:C.bg, border:`1px solid ${highlight !== undefined ? (highlight ? "#5cb87a" : C.red) : C.line}`,
            borderRadius:6, color:C.text, fontSize:20, outline:"none", boxSizing:"border-box" as const, letterSpacing:"0.5em", textAlign:"center" as const }} />
      </div>
    );

    const [verifyEmail, setVerifyEmail] = useState("");
    const [emailVerified, setEmailVerified] = useState(false);
    const [verifyErr, setVerifyErr] = useState("");

    const handleVerifyEmail = () => {
      const authEmail = (co?.auth_email || "").toLowerCase().trim();
      if (verifyEmail.toLowerCase().trim() === authEmail) {
        setEmailVerified(true);
        setVerifyErr("");
      } else {
        setVerifyErr("Email does not match our records");
      }
    };

    const pinBoxes = (val: string, set: (v:string)=>void, prefix: string, highlight?: boolean) => (
      <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
        {[0,1,2,3,4,5].map(i => (
          <input key={i} id={`${prefix}-${i}`} type="text" inputMode="numeric" maxLength={1}
            value={val[i] || ""}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, "");
              if (!v && val[i]) { set(val.slice(0,i) + val.slice(i+1)); return; }
              if (!v) return;
              set(val.slice(0,i) + v[0] + val.slice(i+1));
              if (i < 5) document.getElementById(`${prefix}-${i+1}`)?.focus();
            }}
            onKeyDown={e => { if (e.key === "Backspace" && !val[i] && i > 0) document.getElementById(`${prefix}-${i-1}`)?.focus(); }}
            style={{ width:44, height:52, textAlign:"center", fontSize:20, fontWeight:700, background:isDark?"#07070a":"#f8f9fb", border:`1.5px solid ${highlight !== undefined ? (highlight ? "#5cb87a" : C.red) : (val[i] ? (isDark?"#c9a84c44":"#2563b033") : C.line)}`, borderRadius:8, color:C.text, outline:"none", boxSizing:"border-box" as const, transition:"all 0.2s", WebkitTextFillColor:C.text }} />
        ))}
      </div>
    );

    const [settingsPage, setSettingsPage] = useState<string|null>(null);

    const sections = [
      { key:"pin", icon:"🔒", title:"Security", desc:"Change your PIN" },
      { key:"appearance", icon:"🎨", title:"Appearance", desc:"Theme and display" },
      { key:"timeout", icon:"⏱", title:"Session", desc:"Timeout settings" },
    ];

    /* Sub-page header */
    const PageHeader = ({ title, icon }: { title: string; icon: string }) => (
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <button onClick={() => { setSettingsPage(null); setEmailVerified(false); setVerifyEmail(""); setVerifyErr(""); setCurPin(""); setNewPin(""); setConfPin(""); }} style={{ background:"none", border:`1px solid ${C.line}`, borderRadius:8, padding:"8px 14px", cursor:"pointer", color:C.gold, fontSize:13, fontWeight:600 }}>← Back</button>
        <span style={{ fontSize:20 }}>{icon}</span>
        <span style={{ fontSize:18, fontWeight:700, color:C.text }}>{title}</span>
      </div>
    );

    /* Full-page sub-views */
    if (settingsPage === "pin") return (
      <div style={{ maxWidth:480 }}>
        <PageHeader title="Security" icon="🔒" />
        {!emailVerified ? (
          <SCard title="Verify Identity">
            <p style={{ fontSize:12, color:C.muted, marginBottom:16 }}>Enter your registered contact email to verify your identity before changing your PIN.</p>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:10, color:C.muted, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:600 }}>Contact Email</label>
              <input value={verifyEmail} onChange={e => setVerifyEmail(e.target.value)} placeholder="As registered with AusClear" type="email"
                style={{ width:"100%", padding:"12px 14px", background:isDark?"#07070a":"#f8f9fb", border:`1px solid ${C.line}`, borderRadius:8, color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" as const, WebkitTextFillColor:C.text }}
                onKeyDown={e => { if (e.key === "Enter") handleVerifyEmail(); }} />
            </div>
            {verifyErr && <p style={{ color:C.red, fontSize:11, marginBottom:8 }}>{verifyErr}</p>}
            <button onClick={handleVerifyEmail} disabled={!verifyEmail.includes("@")}
              style={{ padding:"11px 28px", background:verifyEmail.includes("@") ? C.gold : C.line, border:"none", borderRadius:8, color:verifyEmail.includes("@") ? (isDark?"#07070a":"#fff") : C.dim, fontSize:13, fontWeight:700, cursor:verifyEmail.includes("@") ? "pointer" : "not-allowed" }}>
              Verify
            </button>
          </SCard>
        ) : (
          <SCard title="Change PIN">
            <div style={{ marginBottom:18 }}>
              <label style={{ display:"block", fontSize:10, color:C.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:600 }}>Current PIN</label>
              {pinBoxes(curPin, setCurPin, "cur")}
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={{ display:"block", fontSize:10, color:C.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:600 }}>New PIN</label>
              {pinBoxes(newPin, setNewPin, "new")}
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={{ display:"block", fontSize:10, color:C.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:600 }}>Confirm New PIN</label>
              {pinBoxes(confPin, setConfPin, "conf", confPin.length === 6 ? pinsMatch : undefined)}
            </div>
            {confPin.length === 6 && !pinsMatch && <p style={{ color:C.red, fontSize:11, marginBottom:8 }}>PINs do not match</p>}
            {pinMsg && <p style={{ color:pinMsg.ok ? "#5cb87a" : C.red, fontSize:12, marginBottom:8 }}>{pinMsg.text}</p>}
            <button onClick={handleChangePin} disabled={!pinsMatch || curPin.length !== 6 || pinLoading}
              style={{ padding:"11px 28px", background:pinsMatch && curPin.length === 6 ? C.gold : C.line, border:"none", borderRadius:8, color:pinsMatch && curPin.length === 6 ? (isDark?"#07070a":"#fff") : C.dim, fontSize:13, fontWeight:700, cursor:pinsMatch && curPin.length === 6 ? "pointer" : "not-allowed" }}>
              {pinLoading ? "Changing..." : "Change PIN"}
            </button>
          </SCard>
        )}
      </div>
    );

    if (settingsPage === "appearance") return (
      <div style={{ maxWidth:480 }}>
        <PageHeader title="Appearance" icon="🎨" />
        <SCard title="Theme">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:C.text }}>Theme</div>
              <div style={{ fontSize:11, color:C.muted }}>Switch between dark and light mode</div>
            </div>
            <button onClick={toggleTheme} style={{ padding:"8px 16px", border:`1px solid ${C.line}`, background:C.bg, borderRadius:6, cursor:"pointer", fontSize:13, color:C.text }}>{isDark ? "☀️ Light" : "🌙 Dark"}</button>
          </div>
        </SCard>
      </div>
    );

    if (settingsPage === "timeout") return (
      <div style={{ maxWidth:480 }}>
        <PageHeader title="Session Timeout" icon="⏱" />
        <SCard title="Auto-logout">
          <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>Auto-logout after inactivity. Current: <strong style={{ color:C.text }}>{timeoutMin} minutes</strong></div>
          <div style={{ display:"flex", gap:8 }}>
            {[10, 15, 30, 60].map(m => (
              <button key={m} onClick={() => { setTimeoutMin(m); localStorage.setItem("ausclear_timeout", m.toString()); }}
                style={{ flex:1, padding:"12px 0", border:`1px solid ${timeoutMin === m ? C.gold : C.line}`, background:timeoutMin === m ? C.goldD : "transparent", borderRadius:8, color:timeoutMin === m ? C.gold : C.muted, fontSize:14, fontWeight:timeoutMin === m ? 700 : 400, cursor:"pointer" }}>
                {m}m
              </button>
            ))}
          </div>
        </SCard>
      </div>
    );

    if (settingsPage === "company") return (
      <div style={{ maxWidth:560 }}>
        <PageHeader title="Company Information" icon="🏢" />
        <SCard title="Editable Details">
          <EditSection fields={[
            { key:"company_name", label:"Company Name", value:co?.company_name },
            { key:"phone", label:"Phone", value:co?.phone },
            { key:"website", label:"Website", value:co?.website },
            { key:"industry", label:"Industry", value:co?.industry },
            { key:"purchase_order", label:"Purchase Order Number", value:co?.purchase_order },
          ]} />
        </SCard>
        <SCard title="Read-Only">
          {[
            { label:"Account Number", value:co?.account_number, gold:true },
            { label:"ABN", value:co?.abn },
            { label:"Application Number", value:co?.application_number },
            { label:"Payment Preference", value:co?.payment_preference },
            { label:"Onboarding", value:co?.onboarding_complete ? "✓ Complete" : "In Progress" },
          ].filter(r => r.value).map((row, i, arr) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:i < arr.length-1 ? `1px solid ${C.line}` : "none" }}>
              <span style={{ fontSize:13, color:C.muted }}>{row.label}</span>
              <span style={{ fontSize:13, color:(row as any).gold ? C.gold : C.text, fontWeight:(row as any).gold ? 700 : 500, fontFamily:(row as any).gold ? "monospace" : "inherit" }}>{row.value}</span>
            </div>
          ))}
        </SCard>
      </div>
    );

    if (settingsPage === "authoriser") return (
      <div style={{ maxWidth:560 }}>
        <PageHeader title="Clearance Authoriser" icon="🔐" />
        <SCard title="Authoriser Details">
          <EditSection fields={[
            { key:"auth_first_name", label:"First Name", value:co?.auth_first_name },
            { key:"auth_last_name", label:"Last Name", value:co?.auth_last_name },
            { key:"auth_email", label:"Email", value:co?.auth_email },
            { key:"auth_phone", label:"Phone", value:co?.auth_phone },
            { key:"auth_job_title", label:"Job Title", value:co?.auth_job_title },
          ]} />
          <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", marginTop:8 }}>
            <span style={{ fontSize:13, color:C.muted }}>Clearance Authoriser</span>
            <span style={{ fontSize:13, color:co?.clearance_authoriser === "Yes" ? "#5cb87a" : C.text, fontWeight:600 }}>{co?.clearance_authoriser || "—"}</span>
          </div>
        </SCard>
      </div>
    );

    if (settingsPage === "billing") return (
      <div style={{ maxWidth:560 }}>
        <PageHeader title="Billing Contact" icon="💳" />
        <SCard title="Billing Details">
          <EditSection fields={[
            { key:"billing_first_name", label:"First Name", value:co?.billing_first_name },
            { key:"billing_last_name", label:"Last Name", value:co?.billing_last_name },
            { key:"billing_email", label:"Email", value:co?.billing_email },
            { key:"billing_phone", label:"Phone", value:co?.billing_phone },
            { key:"billing_job_title", label:"Job Title", value:co?.billing_job_title },
          ]} />
          <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", marginTop:8 }}>
            <span style={{ fontSize:13, color:C.muted }}>Billing Authoriser</span>
            <span style={{ fontSize:13, color:co?.billing_authoriser === "Yes" ? "#5cb87a" : C.text, fontWeight:600 }}>{co?.billing_authoriser || "—"}</span>
          </div>
        </SCard>
      </div>
    );

    if (settingsPage === "address") return (
      <div style={{ maxWidth:560 }}>
        <PageHeader title="Billing Address" icon="📍" />
        <SCard title="Address Details">
          <EditSection fields={[
            { key:"billing_street", label:"Street", value:co?.billing_street },
            { key:"billing_suburb", label:"Suburb", value:co?.billing_suburb },
            { key:"billing_state", label:"State", value:co?.billing_state },
            { key:"billing_postcode", label:"Post Code", value:co?.billing_postcode },
            { key:"billing_country", label:"Country", value:co?.billing_country },
          ]} />
        </SCard>
      </div>
    );

    if (settingsPage === "status") return (
      <div style={{ maxWidth:560 }}>
        <PageHeader title="Account Status" icon="📊" />
        <SCard title="Clearance Summary">
          {[
            { label:"Applications Received", value:co?.applications_received },
            { label:"Total Nominees", value:co?.total_nominees },
            { label:"Baseline", value:co?.baseline_total },
            { label:"NV1", value:co?.nv1_total },
            { label:"NV2", value:co?.nv2_total },
            { label:"New", value:co?.new_total },
            { label:"Upgrade", value:co?.upgrade_total },
            { label:"Transfer", value:co?.transfer_total },
          ].map((row, i, arr) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:i < arr.length-1 ? `1px solid ${C.line}` : "none" }}>
              <span style={{ fontSize:13, color:C.muted }}>{row.label}</span>
              <span style={{ fontSize:13, color:C.text, fontWeight:600 }}>{row.value ?? "—"}</span>
            </div>
          ))}
        </SCard>
      </div>
    );

    /* Settings overview — clickable section cards */
    return (
      <div style={{ maxWidth:560 }}>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.gold, textTransform:"uppercase", letterSpacing:"0.2em", marginBottom:4 }}>Settings</div>
          <div style={{ fontSize:13, color:C.muted }}>{co?.company_name} · {co?.account_number}</div>
        </div>

        <div style={{ display:"flex", flexDirection:"column" as const, gap:8 }}>
          {sections.map(s => (
            <div key={s.key} onClick={() => setSettingsPage(s.key)}
              style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:10, padding:"16px 20px", cursor:"pointer", display:"flex", alignItems:"center", gap:14, boxShadow:isDark?"0 2px 8px rgba(0,0,0,0.2)":"0 1px 4px rgba(0,0,0,0.04)", transition:"all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.gold; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.line; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>
              <span style={{ fontSize:24 }}>{s.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{s.title}</div>
                <div style={{ fontSize:12, color:C.muted }}>{s.desc}</div>
              </div>
              <span style={{ color:C.dim, fontSize:18 }}>›</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!mounted) return <div style={{ minHeight:"100vh", background:"#07070a" }} />;

  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" as const }}>
        <div style={{ width:32, height:32, border:`2px solid ${C.line}`, borderTopColor:C.gold, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
        <p style={{ color:C.muted, fontSize:11, letterSpacing:"0.2em" }}>LOADING...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow 0.2s", padding:32, textAlign:"center" as const }}>
        <p style={{ color:C.red, marginBottom:16 }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ background:C.gold, border:"none", padding:"10px 22px", color:C.bg, fontWeight:700, cursor:"pointer", borderRadius:4, marginRight:8 }}>Retry</button>
        <button onClick={() => router.push("/login")} style={{ background:"none", border:`1px solid ${C.line}`, padding:"10px 22px", color:C.muted, cursor:"pointer", borderRadius:4 }}>Login</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", display:"flex", flexDirection:"column" }}>
      {showNominate && <NominateModal onClose={() => setShowNominate(false)} theme={theme} />}

      {/* Session timeout warning */}
      {showTimeout && (
        <>
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:300 }} />
          <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:301, width:"min(400px,90vw)", background:C.card, border:`1px solid ${C.line}`, borderRadius:12, borderTop:`3px solid ${C.gold}`, padding:32, textAlign:"center" as const, boxShadow:isDark?"0 24px 64px rgba(0,0,0,0.8)":"0 24px 64px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>⏱️</div>
            <h2 style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:8 }}>Session Expiring</h2>
            <p style={{ fontSize:13, color:C.muted, marginBottom:16 }}>Your session will expire due to inactivity. Move your mouse or tap anywhere to stay signed in.</p>
            <div style={{ fontSize:32, fontWeight:700, color:countdown <= 30 ? C.red : C.gold, fontFamily:"monospace", marginBottom:16 }}>
              {Math.floor(countdown/60)}:{(countdown%60).toString().padStart(2,"0")}
            </div>
            <button onClick={() => { lastActivity.current = Date.now(); setShowTimeout(false); setCountdown(120); }}
              style={{ padding:"10px 28px", background:C.gold, border:"none", borderRadius:6, color:isDark?"#07070a":"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>
              Stay Signed In
            </button>
          </div>
        </>
      )}

      {/* Admin impersonation banner */}
      {isAdmin && (
        <div style={{ background:"linear-gradient(90deg, #c05050, #8a3030)", padding:"8px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", zIndex:60 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14 }}>⚡</span>
            <span style={{ fontSize:12, fontWeight:700, color:"#fff" }}>Admin View</span>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.7)" }}>Viewing as {co?.company_name || co?.account_number || "—"}</span>
          </div>
          <button onClick={() => { sessionStorage.removeItem("admin_impersonate"); sessionStorage.removeItem("account_number"); window.location.href = "/admin"; }}
            style={{ background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", padding:"5px 14px", borderRadius:6, color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer" }}>
            ← Back to Admin
          </button>
        </div>
      )}

      <div style={{ position:"sticky", top:0, zIndex:50, background:C.topbar, backdropFilter:"blur(16px)", borderBottom:`1px solid ${C.line}`, boxShadow:isDark?"0 4px 20px rgba(0,0,0,0.5)":"0 2px 12px rgba(0,0,0,0.06)", height:64, padding:"0 24px", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${C.brandGold}, ${C.brandGold}55, transparent)` }} />
        <div style={{ display:"flex", alignItems:"center", gap:isMobile ? 8 : 14 }}>
          {isMobile && tab !== "overview" && (
            <button onClick={() => setTab("overview")} style={{ background:"none", border:"none", color:C.gold, cursor:"pointer", fontSize:24, padding:"4px 8px 4px 0", lineHeight:1, fontWeight:700 }}>‹</button>
          )}
          <div>
            <div style={{ fontSize:isMobile?14:16, fontWeight:700, letterSpacing:0.3, lineHeight:1.2 }}><span style={{ color:C.text }}>AusClear</span> <span style={{ color:C.brandGold }}>Corporate Connect™</span></div>
            {!isMobile && <div style={{ fontSize:12, color:C.text, fontWeight:500, marginTop:1 }}>{co?.company_name || "Corporate Portal"} <span style={{ color:C.gold, fontFamily:"monospace", fontWeight:700 }}>{co?.account_number || ""}</span></div>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => setTab("messages" as any)} style={{ background:"none", border:`1px solid ${C.line}`, borderRadius:8, padding:"7px 10px", cursor:"pointer", color:C.muted, fontSize:14, lineHeight:1, display:"flex", alignItems:"center", position:"relative" }}>
            🔔
            {unreadMsgCount > 0 && <span style={{ position:"absolute", top:-5, right:-5, background:C.red, color:"#fff", fontSize:9, fontWeight:700, borderRadius:"50%", width:17, height:17, display:"flex", alignItems:"center", justifyContent:"center", animation:"pulse 2s infinite" }}>{unreadMsgCount}</span>}
          </button>
          <button onClick={toggleTheme} title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            style={{ background:"none", border:`1px solid ${C.line}`, borderRadius:6, padding:"6px 10px", cursor:"pointer", color:C.muted, fontSize:14, lineHeight:1, display:"flex", alignItems:"center" }}>
            {isDark ? "☀️" : "🌙"}
          </button>
          {isMobile && (
            <div style={{ position:"relative" }}>
              <button onClick={() => setMenuOpen(o=>!o)} style={{ background:"none", border:`1px solid ${C.line}`, padding:"6px 12px", color:C.muted, cursor:"pointer", fontSize:13, borderRadius:6 }}>☰</button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position:"fixed", inset:0, zIndex:49 }} />
                <div style={{ position:"absolute", right:0, top:38, background:C.card, border:`1px solid ${C.line}`, borderRadius:10, zIndex:50, minWidth:180, boxShadow:"0 8px 24px rgba(0,0,0,0.6)" }}>
                  {TABS.map(t => (
                    <button key={t.key} onClick={() => { setTab(t.key); setMenuOpen(false); }}
                      style={{ display:"flex", alignItems:"center", width:"100%", padding:"13px 18px", border:"none", borderBottom:`1px solid ${C.line}`, background:tab===t.key?"rgba(201,168,76,0.08)":"transparent", color:tab===t.key?C.gold:C.text, fontSize:13, cursor:"pointer", textAlign:"left" as const }}>
                      {t.label}
                      {t.key === "messages" && unreadMsgCount > 0 && <span style={{ marginLeft:"auto", background:C.red, color:"#fff", fontSize:9, fontWeight:700, borderRadius:10, padding:"2px 7px" }}>{unreadMsgCount}</span>}
                    </button>
                  ))}
                  <button onClick={() => { router.push("/logout"); }} style={{ display:"block", width:"100%", padding:"12px 18px", border:"none", background:"transparent", color:C.muted, fontSize:12, cursor:"pointer", textAlign:"left" as const }}>Sign Out</button>
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </div>

      <div style={{ flex:1, display:"flex", minHeight:0 }}>
        {!isMobile && (
          <div style={{ width:240, flexShrink:0, background:isDark?"linear-gradient(180deg,#0d1018 0%,#0a0d14 100%)":C.side, borderRight:`1px solid ${C.line}`, position:"sticky", top:64, height:"calc(100vh - 64px)", display:"flex", flexDirection:"column", overflowY:"auto" }}>
            {/* Company info */}
            <div style={{ padding:"20px 18px 16px", borderBottom:`1px solid ${C.line}`, background:isDark?"rgba(201,168,76,0.03)":"rgba(154,117,48,0.03)" }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{co?.company_name || "—"}</div>
              <div style={{ fontSize:11, color:C.muted }}>ABN {co?.abn || "—"}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Account: <span style={{ color:C.gold, fontFamily:"monospace", fontWeight:700 }}>{co?.account_number || "—"}</span></div>
              <div style={{ marginTop:10 }}>
                <span style={{ fontSize:10, fontWeight:700, color:C.green, background:"rgba(92,184,122,0.12)", border:"1px solid rgba(92,184,122,0.3)", padding:"3px 10px", borderRadius:4, letterSpacing:"0.05em" }}>● ACTIVE</span>
              </div>
            </div>
            {/* Nav */}
            <nav style={{ padding:"8px 0", flex:1 }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ display:"flex", alignItems:"center", width:"100%", padding:"13px 20px", border:"none", borderLeft:tab===t.key?`3px solid ${C.gold}`:"3px solid transparent", background:tab===t.key?C.goldD:"transparent", color:tab===t.key?C.gold:C.muted, fontSize:13, fontWeight:tab===t.key?700:400, cursor:"pointer", textAlign:"left" as const, transition:"all 0.2s", letterSpacing:"0.01em" }}
                  onMouseEnter={e => { if(tab!==t.key) e.currentTarget.style.background = isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)"; }}
                  onMouseLeave={e => { if(tab!==t.key) e.currentTarget.style.background = "transparent"; }}>
                  <span style={{ marginRight:10, fontSize:15, opacity:tab===t.key?1:0.6 }}>{t.icon}</span>{t.label}
                  {t.key === "messages" && unreadMsgCount > 0 && <span style={{ marginLeft:"auto", background:C.red, color:"#fff", fontSize:9, fontWeight:700, borderRadius:10, padding:"2px 7px", animation:"pulse 2s infinite" }}>{unreadMsgCount}</span>}
                </button>
              ))}
            </nav>
            {/* Sign out section */}
            <div style={{ borderTop:`1px solid ${C.line}`, padding:"16px 18px", background:isDark?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.03)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:isDark?"rgba(201,168,76,0.15)":"rgba(154,117,48,0.1)", border:`1px solid ${C.gold}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:C.gold }}>{(co?.company_name || "C")[0]}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{co?.company_name || "—"}</div>
                  <div style={{ fontSize:10, color:C.dim }}>{co?.account_number || ""}</div>
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => { sessionStorage.removeItem("admin_impersonate"); sessionStorage.removeItem("account_number"); window.location.href = "/admin"; }}
                  style={{ width:"100%", padding:"9px 0", border:"1px solid rgba(58,118,176,0.3)", background:"rgba(58,118,176,0.08)", color:"#3a76b0", fontSize:12, fontWeight:600, cursor:"pointer", borderRadius:6, transition:"all 0.15s", marginBottom:6 }}>
                  ⚡ Back to Admin
                </button>
              )}
              <button onClick={() => { router.push("/logout"); }}
                style={{ width:"100%", padding:"9px 0", border:`1px solid ${isDark?"rgba(199,122,122,0.3)":"rgba(192,80,80,0.3)"}`, background:isDark?"rgba(199,122,122,0.08)":"rgba(192,80,80,0.06)", color:C.red, fontSize:12, fontWeight:600, cursor:"pointer", borderRadius:6, transition:"all 0.15s" }}>
                Sign Out
              </button>
              <div style={{ fontSize:9, color:C.dim, marginTop:10, textAlign:"center" as const, letterSpacing:"0.1em" }}>AUSCLEAR CORPORATE CONNECT™</div>
              <div style={{ fontSize:9, color:C.dim, marginTop:2, textAlign:"center" as const }}>support@ausclear.com.au</div>
            </div>
          </div>
        )}
        <div style={{ flex:1, overflowY:"auto", minWidth:0, background:isDark?"linear-gradient(180deg,#07070a 0%,#0a0b10 100%)":C.bg }}>
          <main style={{ padding:isMobile?"16px 16px 60px":"28px 32px 60px", maxWidth:960, margin:"0 auto" }}>
            {/* KPI bar across top — desktop only */}
            {!isMobile && (
              <div style={{ display:"flex", gap:8, marginBottom:20 }}>
                {[
                  { label:"Staff",    value:co?.total_nominees??0, col:C.text  },
                  { label:"Fees",     value:$k(fees),              col:C.gold  },
                  { label:"BSL",      value:co?.baseline_total??0, col:C.green },
                  { label:"NV1",      value:co?.nv1_total??0,      col:C.blue  },
                  { label:"NV2",      value:co?.nv2_total??0,      col:C.amber },
                  { label:"New",      value:co?.new_total??0,      col:C.green },
                ].map((s,i) => (
                  <div key={i} style={{ flex:1, background:C.card, border:`1px solid ${C.line}`, borderRadius:12, padding:"16px 10px", textAlign:"center" as const, boxShadow:isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)", transition:"transform 0.2s, box-shadow 0.2s", cursor:"default" }}
                    onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=isDark?"0 8px 24px rgba(0,0,0,0.4)":"0 4px 16px rgba(0,0,0,0.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=isDark?"0 4px 16px rgba(0,0,0,0.25)":"0 2px 8px rgba(0,0,0,0.05)"; }}>
                    <div style={{ fontSize:22, fontWeight:700, color:s.col, lineHeight:1.2 }}>{typeof s.value === "number" ? <AnimNum value={s.value} /> : s.value}</div>
                    <div style={{ fontSize:9, color:C.dim, textTransform:"uppercase" as const, letterSpacing:"0.12em", marginTop:5, fontWeight:600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Notification banner from admin */}
            {notifBanner && (
              <div style={{
                background: notifBanner.type === "warning" ? (isDark?"rgba(212,147,92,0.08)":"rgba(212,147,92,0.06)") : notifBanner.type === "success" ? (isDark?"rgba(92,184,122,0.08)":"rgba(92,184,122,0.06)") : (isDark?"rgba(58,118,176,0.08)":"rgba(58,118,176,0.06)"),
                border: `1px solid ${notifBanner.type === "warning" ? (isDark?"rgba(212,147,92,0.25)":"rgba(212,147,92,0.2)") : notifBanner.type === "success" ? (isDark?"rgba(92,184,122,0.25)":"rgba(92,184,122,0.2)") : (isDark?"rgba(58,118,176,0.25)":"rgba(58,118,176,0.2)")}`,
                borderRadius: 10, padding: "12px 18px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 16 }}>{notifBanner.type === "warning" ? "⚠️" : notifBanner.type === "success" ? "✅" : "ℹ️"}</span>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{notifBanner.text}</div>
              </div>
            )}

            {showWelcome && (
              <div style={{ background:isDark?"linear-gradient(135deg, #111828 0%, #0d1420 100%)":"linear-gradient(135deg, #f8faff 0%, #eef3fb 100%)", border:`1px solid ${isDark?"rgba(201,168,76,0.15)":"rgba(37,99,176,0.12)"}`, borderRadius:16, padding:"28px 28px 24px", position:"relative" as const, overflow:"hidden", boxShadow:isDark?"0 8px 32px rgba(0,0,0,0.3)":"0 4px 20px rgba(0,0,0,0.06)", marginBottom:16 }}>
                <div style={{ position:"absolute" as const, top:0, left:0, right:0, height:3, background:isDark?"linear-gradient(90deg, #c9a84c, #9a7530, transparent)":"linear-gradient(90deg, #2563b0, #4a90c4, transparent)" }} />
                <div style={{ position:"absolute" as const, top:20, right:20, opacity:0.04, fontSize:120, lineHeight:1, pointerEvents:"none" as const }}>🛡️</div>
                <button onClick={() => { setShowWelcome(false); const acct = sessionStorage.getItem("account_number"); if(acct) localStorage.setItem(`ausclear_welcomed_${acct}`, "1"); }}
                  style={{ position:"absolute" as const, top:12, right:14, background:"none", border:"none", color:C.muted, fontSize:18, cursor:"pointer", padding:4, lineHeight:1 }}>✕</button>
                <div style={{ fontSize:11, color:C.gold, textTransform:"uppercase" as const, letterSpacing:"0.15em", fontWeight:600, marginBottom:8 }}>Welcome to Corporate Connect™</div>
                <div style={{ fontSize:22, fontWeight:700, color:C.text, marginBottom:6 }}>{co?.auth_first_name ? `Hello, ${co.auth_first_name}` : "Welcome"}</div>
                <div style={{ fontSize:13, color:C.muted, lineHeight:1.6, maxWidth:520 }}>
                  Your secure clearance management portal for <span style={{ color:C.text, fontWeight:600 }}>{co?.company_name || "your organisation"}</span>. 
                  Track your sponsored employees, monitor clearance progress, manage nominations, view financials, and communicate directly with your AusClear account team.
                </div>
                <div style={{ display:"flex", gap:10, marginTop:18, flexWrap:"wrap" as const }}>
                  {[
                    { icon:"👥", label:"Personnel", desc:"Track your sponsored staff", tab:"personnel" as const },
                    { icon:"📊", label:"Analytics", desc:"Clearance progress insights", tab:"analytics" as const },
                    { icon:"💰", label:"Financials", desc:"Invoices & payments", tab:"financials" as const },
                    { icon:"✉️", label:"Messages", desc:"Contact your account team", tab:"messages" as const },
                  ].map((q,i) => (
                    <button key={i} onClick={() => setTab(q.tab)}
                      style={{ flex:"1 1 120px", background:isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)", border:`1px solid ${C.line}`, borderRadius:10, padding:"12px 14px", cursor:"pointer", textAlign:"left" as const, transition:"all 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor=C.gold; e.currentTarget.style.background=isDark?"rgba(201,168,76,0.04)":"rgba(37,99,176,0.04)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor=C.line; e.currentTarget.style.background=isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)"; }}>
                      <div style={{ fontSize:18, marginBottom:4 }}>{q.icon}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{q.label}</div>
                      <div style={{ fontSize:10, color:C.dim, marginTop:2 }}>{q.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab==="overview"   && <div key="ov" style={{ animation:"fadeIn 0.3s ease" }}><Overview /></div>}
            {tab==="batches"    && <div key="ba" style={{ animation:"fadeIn 0.3s ease" }}><Batches /></div>}
            {tab==="personnel"  && <div key="pe" style={{ animation:"fadeIn 0.3s ease" }}><Personnel /></div>}
            {tab==="financials" && <div key="fi" style={{ animation:"fadeIn 0.3s ease" }}><Financials /></div>}
            {tab==="analytics"  && <div key="an" style={{ animation:"fadeIn 0.3s ease" }}>
              <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:8 }}>
                <button onClick={exportAnalyticsCSV} style={{ background:"transparent", border:`1px solid ${C.line}`, padding:"9px 14px", color:C.muted, fontSize:12, cursor:"pointer", borderRadius:4 }}>📥 Export Groups</button>
              </div>
              <AnalyticsTab company={co} personnel={ppl} batches={batches} isMobile={isMobile} theme={theme} />
            </div>}
            {tab==="settings"   && <div key="se" style={{ animation:"fadeIn 0.3s ease" }}><Settings /></div>}
            {tab==="account"    && (
              <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:16 }}>
                <SCard title="🏢 Company Information">
                  <EditSection fields={[
                    { key:"company_name", label:"Company Name", value:co?.company_name },
                    { key:"phone", label:"Phone", value:co?.phone },
                    { key:"website", label:"Website", value:co?.website },
                    { key:"industry", label:"Industry", value:co?.industry },
                    { key:"purchase_order", label:"Purchase Order Number", value:co?.purchase_order },
                  ]} />
                  {[
                    { label:"Account Number", value:co?.account_number, gold:true },
                    { label:"ABN", value:co?.abn },
                    { label:"Application Number", value:co?.application_number },
                    { label:"Payment Preference", value:co?.payment_preference },
                    { label:"Onboarding", value:co?.onboarding_complete ? "✓ Complete" : "In Progress" },
                  ].filter(r => r.value).map((row, i, arr) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:i < arr.length-1 ? `1px solid ${C.line}` : "none" }}>
                      <span style={{ fontSize:13, color:C.muted }}>{row.label}</span>
                      <span style={{ fontSize:13, color:(row as any).gold ? C.gold : C.text, fontWeight:(row as any).gold ? 700 : 500, fontFamily:(row as any).gold ? "monospace" : "inherit" }}>{row.value}</span>
                    </div>
                  ))}
                </SCard>

                <SCard title="🔐 Clearance Authoriser">
                  <EditSection fields={[
                    { key:"auth_first_name", label:"First Name", value:co?.auth_first_name },
                    { key:"auth_last_name", label:"Last Name", value:co?.auth_last_name },
                    { key:"auth_email", label:"Email", value:co?.auth_email },
                    { key:"auth_phone", label:"Phone", value:co?.auth_phone },
                    { key:"auth_job_title", label:"Job Title", value:co?.auth_job_title },
                  ]} />
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", marginTop:8 }}>
                    <span style={{ fontSize:13, color:C.muted }}>Clearance Authoriser</span>
                    <span style={{ fontSize:13, color:co?.clearance_authoriser === "Yes" ? "#5cb87a" : C.text, fontWeight:600 }}>{co?.clearance_authoriser || "—"}</span>
                  </div>
                </SCard>

                <SCard title="💳 Billing Contact">
                  <EditSection fields={[
                    { key:"billing_first_name", label:"First Name", value:co?.billing_first_name },
                    { key:"billing_last_name", label:"Last Name", value:co?.billing_last_name },
                    { key:"billing_email", label:"Email", value:co?.billing_email },
                    { key:"billing_phone", label:"Phone", value:co?.billing_phone },
                    { key:"billing_job_title", label:"Job Title", value:co?.billing_job_title },
                  ]} />
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", marginTop:8 }}>
                    <span style={{ fontSize:13, color:C.muted }}>Billing Authoriser</span>
                    <span style={{ fontSize:13, color:co?.billing_authoriser === "Yes" ? "#5cb87a" : C.text, fontWeight:600 }}>{co?.billing_authoriser || "—"}</span>
                  </div>
                </SCard>

                <SCard title="📍 Billing Address">
                  <EditSection fields={[
                    { key:"billing_street", label:"Street", value:co?.billing_street },
                    { key:"billing_suburb", label:"Suburb", value:co?.billing_suburb },
                    { key:"billing_state", label:"State", value:co?.billing_state },
                    { key:"billing_postcode", label:"Post Code", value:co?.billing_postcode },
                    { key:"billing_country", label:"Country", value:co?.billing_country },
                  ]} />
                </SCard>

                <div style={{ gridColumn:isMobile?"1":"1 / -1" }}>
                  <SCard title="📊 Account Status">
                    <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4, 1fr)", gap:12 }}>
                      {[
                        { label:"Total Nominees", value:co?.total_nominees, col:C.text },
                        { label:"Total Fees", value:co?.total_fees ? `$${co.total_fees.toLocaleString()}` : "$0", col:C.gold },
                        { label:"Baseline", value:co?.baseline_total, col:C.green },
                        { label:"NV1", value:co?.nv1_total, col:C.blue },
                        { label:"NV2", value:co?.nv2_total, col:C.gold },
                        { label:"New", value:co?.new_total, col:C.green },
                        { label:"Upgrade", value:co?.upgrade_total, col:C.amber },
                        { label:"Transfer", value:co?.transfer_total, col:C.muted },
                        { label:"Applications", value:co?.applications_received, col:C.text },
                      ].map((s, i) => (
                        <div key={i} style={{ background:C.bg, borderRadius:8, padding:"12px 14px", textAlign:"center" as const }}>
                          <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase" as const, letterSpacing:"0.1em", marginBottom:4 }}>{s.label}</div>
                          <div style={{ fontSize:22, fontWeight:700, color:s.col }}>{s.value ?? "—"}</div>
                        </div>
                      ))}
                    </div>
                  </SCard>
                </div>
              </div>
            )}
            {tab==="messages"   && <MessagesTab accountNumber={co?.account_number || ""} companyName={co?.company_name || ""} contactName={[co?.auth_first_name, co?.auth_last_name].filter(Boolean).join(" ")} personnel={ppl.map(p => ({ employee_name: p.employee_name, clearance_type: p.clearance_type }))} C={C} isDark={isDark} />}
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:60, background:C.topbar, backdropFilter:"blur(16px)", borderTop:`1px solid ${C.line}`, display:"flex", padding:"6px 4px", boxShadow:isDark?"0 -2px 12px rgba(0,0,0,0.4)":"0 -2px 8px rgba(0,0,0,0.06)" }}>
          {([
            { key:"overview", icon:"⊞", label:"Home" },
            { key:"personnel", icon:"👥", label:"Staff" },
            { key:"batches", icon:"📋", label:"Groups" },
            { key:"messages", icon:"💬", label:"Messages" },
            { key:"settings", icon:"⚙️", label:"Settings" },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              style={{ flex:1, background:"none", border:"none", cursor:"pointer", padding:"6px 0", display:"flex", flexDirection:"column" as const, alignItems:"center", gap:2, color:tab===t.key?C.gold:C.dim, transition:"all 0.15s", position:"relative" }}>
              {t.key === "messages" && unreadMsgCount > 0 && <span style={{ position:"absolute", top:2, right:"calc(50% - 16px)", background:C.red, color:"#fff", fontSize:8, fontWeight:700, borderRadius:"50%", width:14, height:14, display:"flex", alignItems:"center", justifyContent:"center" }}>{unreadMsgCount}</span>}
              <span style={{ fontSize:18 }}>{t.icon}</span>
              <span style={{ fontSize:9, fontWeight:tab===t.key?700:400 }}>{t.label}</span>
              {tab===t.key && <div style={{ position:"absolute", top:0, left:"25%", right:"25%", height:2, background:C.gold, borderRadius:1 }} />}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}
