"use client";
import { useState, useEffect } from "react";

export default function MaintenancePage() {
  const [message, setMessage] = useState("The portal is currently undergoing scheduled maintenance. Please try again shortly.");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Clear session — user is signed out
    sessionStorage.removeItem("account_number");
    sessionStorage.removeItem("admin_impersonate");
    // Fetch maintenance message
    fetch("/api/admin/maintenance-check")
      .then(r => r.json())
      .then(d => { if (d.message) setMessage(d.message); })
      .catch(() => {});
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(145deg, #f0f2f5 0%, #e8ecf0 40%, #f4f5f7 100%)", padding:20, position:"relative", overflow:"hidden", fontFamily:"'Segoe UI',sans-serif" }}>
      <div style={{ position:"absolute", inset:0, opacity:0.03, backgroundImage:"radial-gradient(circle at 25% 25%, #9a7530 1px, transparent 1px), radial-gradient(circle at 75% 75%, #9a7530 1px, transparent 1px)", backgroundSize:"60px 60px" }} />

      <div style={{ width:"100%", maxWidth:480, position:"relative", zIndex:1, textAlign:"center" }}>
        {/* Brand */}
        <div style={{ marginBottom:32 }}>
          <div style={{ width:64, height:64, margin:"0 auto 16px", borderRadius:14, background:"linear-gradient(135deg, #2563b0, #1d5a9e)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 32px rgba(37,99,176,0.15)" }}>
            <span style={{ fontSize:28, fontWeight:800, color:"#fff" }}>AC</span>
          </div>
          <h1 style={{ fontSize:26, fontWeight:700, color:"#1a1a2e", margin:0, letterSpacing:"-0.02em" }}>
            AusClear <span style={{ color:"#9a7530" }}>Corporate Connect</span><span style={{ color:"#9a7530", fontSize:16, verticalAlign:"super" }}>™</span>
          </h1>
        </div>

        {/* Maintenance card */}
        <div style={{ background:"#fff", border:"1px solid #d8dce4", borderRadius:16, padding:"40px 32px", boxShadow:"0 20px 60px rgba(0,0,0,0.06)", borderTop:"3px solid #d4935c" }}>
          <div style={{ width:56, height:56, margin:"0 auto 20px", borderRadius:"50%", background:"rgba(212,147,92,0.08)", border:"1px solid rgba(212,147,92,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:28 }}>🔧</span>
          </div>
          <h2 style={{ fontSize:20, fontWeight:700, color:"#1a1a2e", marginBottom:12 }}>Scheduled Maintenance</h2>
          <p style={{ fontSize:14, color:"#6b6b7b", lineHeight:1.7, marginBottom:24 }}>{message}</p>
          <div style={{ background:"rgba(212,147,92,0.06)", border:"1px solid rgba(212,147,92,0.15)", borderRadius:10, padding:"14px 18px" }}>
            <div style={{ fontSize:11, color:"#9a7530", fontWeight:600, marginBottom:4 }}>Need urgent assistance?</div>
            <div style={{ fontSize:13, color:"#1a1a2e" }}>
              <a href="mailto:support@ausclear.com.au" style={{ color:"#2563b0", textDecoration:"none", fontWeight:600 }}>support@ausclear.com.au</a>
              <span style={{ color:"#a0a0a8", margin:"0 8px" }}>|</span>
              <span style={{ fontWeight:600 }}>1300 027 423</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop:24 }}>
          <a href="/login" style={{ color:"#2563b0", textDecoration:"none", fontSize:12, fontWeight:500 }}>← Try signing in again</a>
        </div>

        <div style={{ marginTop:28 }}>
          <p style={{ fontSize:10, color:"#b0b0ba", letterSpacing:"0.1em" }}>AUSCLEAR CORPORATE CONNECT™</p>
          <p style={{ fontSize:10, color:"#c8c8d0", marginTop:4 }}>Nephthys Pty Ltd | ABN 70 628 031 587 | DISP Accredited Sponsor</p>
        </div>
      </div>
    </div>
  );
}
