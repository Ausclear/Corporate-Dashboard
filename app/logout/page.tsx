"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LogoutPage() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const router = useRouter();

  const securitySteps = [
    { id: 1, label: "Terminating secure session..." },
    { id: 2, label: "Clearing cached data..." },
    { id: 3, label: "Securing authentication tokens..." },
    { id: 4, label: "Finalising logout process..." },
  ];

  useEffect(() => {
    const supabase = createClient();
    const TOTAL_MS = 8000;
    const startTime = Date.now();

    // Step 1 — immediately: sign out
    (async () => {
      await supabase.auth.signOut();
      try { sessionStorage.clear(); } catch {}
      try {
        document.cookie.split(";").forEach(c => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });
      } catch {}
    })();

    // Step 2 — at 2s: clear storage/caches
    const t2 = setTimeout(() => {
      setCurrentStep(2);
      try { localStorage.clear(); } catch {}
      try {
        if ("caches" in window) caches.keys().then(ns => ns.forEach(n => caches.delete(n))).catch(() => {});
      } catch {}
    }, 2000);

    // Step 3 — at 4s: remove auth keys
    const t3 = setTimeout(() => {
      setCurrentStep(3);
      const keys = ["authToken","accessToken","refreshToken","userToken","sessionToken","sb-access-token","sb-refresh-token"];
      keys.forEach(k => {
        try { localStorage.removeItem(k); } catch {}
        try { sessionStorage.removeItem(k); } catch {}
      });
      try { window.history.replaceState(null, "", window.location.href); } catch {}
    }, 4000);

    // Step 4 — at 6s: finalise
    const t4 = setTimeout(() => {
      setCurrentStep(4);
      try { if (window.performance?.clearResourceTimings) window.performance.clearResourceTimings(); } catch {}
    }, 6000);

    // Progress bar
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / TOTAL_MS) * 100), 100);
      setProgress(pct);
      if (elapsed >= TOTAL_MS) {
        clearInterval(interval);
        setTimeout(() => {
          setIsComplete(true);
          setTimeout(() => router.push("/login"), 2000);
        }, 300);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, [router]);

  const GOLD = "#c9a84c";
  const BG = "#07070a";
  const CARD = "#202028";
  const INPUT = "#16161c";
  const BORDER = "rgba(255,255,255,0.06)";
  const GOLD_DIM = "rgba(201,168,76,0.15)";
  const GOLD_BORDER = "rgba(201,168,76,0.25)";
  const TEXT = "#e8e6e1";
  const TEXT2 = "#9a9898";
  const GREEN = "#27ae60";
  const GREEN_DIM = "rgba(39,174,96,0.12)";
  const GREEN_BORDER = "rgba(39,174,96,0.3)";

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
          {/* Gold top bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${GOLD}, #b8942e, transparent)` }} />

          <div style={{ padding: "40px 36px" }}>
            {!isComplete ? (
              <>
                {/* Icon + heading */}
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`, borderRadius: "50%", marginBottom: 16, animation: "pulse 2s infinite" }}>
                    <span style={{ fontSize: 40 }}>🔒</span>
                  </div>
                  <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: TEXT, margin: "0 0 8px" }}>Logging Out</h1>
                  <p style={{ fontSize: 13, color: TEXT2, margin: 0, lineHeight: 1.5 }}>
                    Please wait whilst we securely terminate your session and clear sensitive data.
                  </p>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ width: "100%", height: 8, background: INPUT, border: `1px solid ${BORDER}`, borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", background: `linear-gradient(90deg, ${GOLD}, #b8942e)`, borderRadius: 999, width: `${progress}%`, transition: "width 0.05s linear" }} />
                  </div>
                  <p style={{ fontSize: 12, color: TEXT2, textAlign: "center", margin: 0 }}>Processing logout... {progress}%</p>
                </div>

                {/* Security steps */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {securitySteps.map(step => {
                    const isActive = currentStep === step.id;
                    const isDone = currentStep > step.id;
                    return (
                      <div key={step.id} style={{ display: "flex", alignItems: "center", padding: "12px 14px", borderRadius: 10, border: `1px solid ${isActive ? GOLD_BORDER : isDone ? GREEN_BORDER : BORDER}`, background: isActive ? GOLD_DIM : isDone ? GREEN_DIM : INPUT, transition: "all 0.4s" }}>
                        <div style={{ marginRight: 12, flexShrink: 0, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {isActive ? (
                            <div style={{ width: 18, height: 18, border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                          ) : isDone ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : (
                            <div style={{ width: 16, height: 16, border: `2px solid ${BORDER}`, borderRadius: "50%" }} />
                          )}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: isActive ? TEXT : isDone ? GREEN : TEXT2 }}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ textAlign: "center", paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
                  <p style={{ fontSize: 11, color: TEXT2, margin: 0 }}>AusClear Corporate Portal — Secure Session Management</p>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, background: GREEN_DIM, border: `1px solid ${GREEN_BORDER}`, borderRadius: "50%", marginBottom: 16 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: TEXT, margin: "0 0 8px" }}>Logout Complete</h1>
                <p style={{ fontSize: 13, color: TEXT2, margin: "0 0 24px", lineHeight: 1.5 }}>
                  You have been successfully logged out. All session data has been cleared.
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: TEXT2, fontSize: 13 }}>
                  <div style={{ width: 14, height: 14, border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span>Redirecting to login page...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p style={{ fontSize: 12, color: TEXT2, margin: 0 }}>AusClear Corporate Portal</p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
      `}</style>
    </div>
  );
}
