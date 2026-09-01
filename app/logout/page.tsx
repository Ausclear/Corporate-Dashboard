"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const router = useRouter();

  const isDark = typeof window !== "undefined"
    ? (localStorage.getItem("ausclear_theme") || "dark") === "dark"
    : true;

  const C = {
    bg:   isDark ? "#07070a" : "#f4f5f7",
    card: isDark ? "#111318" : "#ffffff",
    line: isDark ? "#1f2535" : "#e2e4e9",
    gold: isDark ? "#c9a84c" : "#9a7530",
    text: isDark ? "#e8e5de" : "#1a1a2e",
    muted:isDark ? "#7a7a82" : "#6b6b7b",
    dim:  isDark ? "#4a4a52" : "#9a9aaa",
    input:isDark ? "#161922" : "#f0f1f3",
    green:"#5cb87a",
  };

  const securitySteps = [
    { id: 1, label: "Terminating secure session..." },
    { id: 2, label: "Clearing cached data..." },
    { id: 3, label: "Securing authentication tokens..." },
    { id: 4, label: "Finalising logout process..." },
  ];

  useEffect(() => {
    const TOTAL_MS = 8000;
    const startTime = Date.now();

    try { sessionStorage.removeItem("account_number"); } catch {}
    try { sessionStorage.clear(); } catch {}

    const t2 = setTimeout(() => {
      setCurrentStep(2);
      const preserved: Record<string, string> = {};
      ["ausclear_theme"].forEach(k => { try { const v = localStorage.getItem(k); if (v) preserved[k] = v; } catch {} });
      try { localStorage.clear(); } catch {}
      Object.entries(preserved).forEach(([k, v]) => { try { localStorage.setItem(k, v); } catch {} });
      try { if ("caches" in window) caches.keys().then(ns => ns.forEach(n => caches.delete(n))).catch(() => {}); } catch {}
    }, 2000);

    const t3 = setTimeout(() => {
      setCurrentStep(3);
      try { window.history.replaceState(null, "", window.location.href); } catch {}
      try { document.cookie.split(";").forEach(c => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`); }); } catch {}
    }, 4000);

    const t4 = setTimeout(() => {
      setCurrentStep(4);
      try { if (window.performance?.clearResourceTimings) window.performance.clearResourceTimings(); } catch {}
    }, 6000);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / TOTAL_MS) * 100), 100);
      setProgress(pct);
      if (elapsed >= TOTAL_MS) {
        clearInterval(interval);
        setTimeout(() => { setIsComplete(true); setTimeout(() => router.push("/login"), 2000); }, 300);
      }
    }, 50);

    return () => { clearInterval(interval); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [router]);

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:16, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ width:"100%", maxWidth:440 }}>
        <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:16, boxShadow:isDark?"0 24px 64px rgba(0,0,0,0.5)":"0 24px 64px rgba(0,0,0,0.1)", overflow:"hidden" }}>
          <div style={{ height:3, background:`linear-gradient(90deg, ${C.gold}, ${C.gold}55, transparent)` }} />
          <div style={{ padding:32 }}>
            {!isComplete ? (
              <>
                <div style={{ textAlign:"center", marginBottom:24 }}>
                  <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:72, height:72, borderRadius:"50%", background:`${C.gold}15`, border:`1px solid ${C.gold}33`, marginBottom:16 }}>
                    <span style={{ fontSize:36 }}>🔒</span>
                  </div>
                  <h1 style={{ fontSize:26, fontWeight:700, color:C.text, marginBottom:8 }}>Logging Out</h1>
                  <p style={{ fontSize:14, color:C.muted, lineHeight:1.5 }}>Please wait whilst we securely terminate your session and clear sensitive data.</p>
                </div>
                <div style={{ marginBottom:24 }}>
                  <div style={{ width:"100%", height:8, background:C.input, border:`1px solid ${C.line}`, borderRadius:8, overflow:"hidden", marginBottom:10 }}>
                    <div style={{ height:"100%", background:`linear-gradient(90deg, ${C.gold}, #b8942e)`, borderRadius:8, width:`${progress}%`, transition:"width 0.05s linear", boxShadow:`0 0 8px ${C.gold}44` }} />
                  </div>
                  <p style={{ fontSize:13, color:C.muted, textAlign:"center" }}>Processing logout... {progress}%</p>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
                  {securitySteps.map((step) => {
                    const isActive = currentStep === step.id;
                    const done = currentStep > step.id;
                    return (
                      <div key={step.id} style={{ display:"flex", alignItems:"center", padding:12, borderRadius:8, transition:"all 0.4s",
                        border:`1px solid ${isActive?C.gold+"44":done?"rgba(92,184,122,0.3)":C.line}`,
                        background:isActive?C.gold+"0d":done?"rgba(92,184,122,0.06)":C.input,
                        color:isActive?C.text:done?C.green:C.muted }}>
                        <div style={{ marginRight:12, flexShrink:0 }}>
                          {isActive ? (
                            <div style={{ width:20, height:20, border:`2px solid ${C.gold}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
                          ) : done ? (
                            <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(92,184,122,0.15)", border:"1px solid rgba(92,184,122,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:C.green }}>✓</div>
                          ) : (
                            <div style={{ width:20, height:20, border:`2px solid ${C.line}`, borderRadius:"50%" }} />
                          )}
                        </div>
                        <span style={{ fontSize:13, fontWeight:500 }}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ textAlign:"center", paddingTop:16, borderTop:`1px solid ${C.line}` }}>
                  <p style={{ fontSize:10, color:C.dim, letterSpacing:"0.1em" }}>AUSCLEAR CORPORATE CONNECT™ — SECURE SESSION MANAGEMENT</p>
                </div>
              </>
            ) : (
              <div style={{ textAlign:"center" }}>
                <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:72, height:72, borderRadius:"50%", background:"rgba(92,184,122,0.1)", border:"1px solid rgba(92,184,122,0.3)", marginBottom:16 }}>
                  <span style={{ fontSize:32, color:C.green }}>✓</span>
                </div>
                <h1 style={{ fontSize:26, fontWeight:700, color:C.text, marginBottom:8 }}>Logout Complete</h1>
                <p style={{ fontSize:14, color:C.muted, marginBottom:24, lineHeight:1.5 }}>You have been successfully logged out. All session data has been cleared.</p>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, color:C.muted, fontSize:13 }}>
                  <div style={{ width:16, height:16, border:`2px solid ${C.gold}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
                  <span>Redirecting to login page...</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <p style={{ textAlign:"center", marginTop:20, fontSize:12, color:C.dim }}>
          <span style={{ color:C.text }}>AusClear</span>{" "}<span style={{ color:C.gold }}>Corporate Connect™</span>
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
