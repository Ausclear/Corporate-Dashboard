"use client";
import { useState, useEffect } from "react";

export default function AdminLogout() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_impersonate");

    const steps = [
      { pct: 30, delay: 400 },
      { pct: 60, delay: 800 },
      { pct: 90, delay: 1200 },
      { pct: 100, delay: 1500 },
    ];
    steps.forEach(s => setTimeout(() => setProgress(s.pct), s.delay));
    setTimeout(() => setDone(true), 2000);
    setTimeout(() => { window.location.href = "/admin"; }, 3500);
  }, []);

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(145deg, #f0f2f5, #e8ecf0)", fontFamily:"'Segoe UI',sans-serif" }}>
      <div style={{ width:"100%", maxWidth:400, textAlign:"center" }}>
        <div style={{ width:56, height:56, margin:"0 auto 16px", borderRadius:12, background:"linear-gradient(135deg, #c05050, #9a3535)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:24, fontWeight:800, color:"#fff" }}>⚡</span>
        </div>
        <h1 style={{ fontSize:20, fontWeight:700, color:"#1a1a2e", margin:"0 0 8px" }}>Admin Console</h1>

        <div style={{ background:"#fff", border:"1px solid #d8dce4", borderRadius:12, padding:"32px 28px", marginTop:20 }}>
          {!done ? (
            <>
              <p style={{ fontSize:14, color:"#6b6b7b", margin:"0 0 20px" }}>Signing out securely...</p>
              <div style={{ width:"100%", height:6, background:"#e8e8ec", borderRadius:3, overflow:"hidden" }}>
                <div style={{ width:`${progress}%`, height:"100%", background:"linear-gradient(90deg, #c05050, #9a3535)", borderRadius:3, transition:"width 0.4s ease" }} />
              </div>
              <p style={{ fontSize:11, color:"#a0a0a8", marginTop:10 }}>{progress < 50 ? "Clearing session..." : progress < 90 ? "Logging activity..." : "Complete"}</p>
            </>
          ) : (
            <>
              <div style={{ width:48, height:48, margin:"0 auto 14px", borderRadius:"50%", background:"rgba(92,184,122,0.08)", border:"1px solid rgba(92,184,122,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:22, color:"#5cb87a" }}>✓</span>
              </div>
              <p style={{ fontSize:16, fontWeight:600, color:"#1a1a2e", margin:"0 0 6px" }}>Signed out</p>
              <p style={{ fontSize:12, color:"#6b6b7b", margin:0 }}>Redirecting to admin login...</p>
            </>
          )}
        </div>

        <p style={{ fontSize:10, color:"#b0b0ba", marginTop:24, letterSpacing:"0.1em" }}>AUSCLEAR CORPORATE CONNECT™</p>
      </div>
    </div>
  );
}
