"use client";
import { useState, useEffect } from "react";

export default function MaintenancePage() {
  const [message, setMessage] = useState("The portal is currently undergoing scheduled maintenance. We're working to restore access as quickly as possible.");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    sessionStorage.removeItem("account_number");
    sessionStorage.removeItem("admin_impersonate");
    fetch("/api/admin/maintenance-check")
      .then(r => r.json())
      .then(d => { if (d.message) setMessage(d.message); })
      .catch(() => {});
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(145deg, #f0f2f5 0%, #e8ecf0 40%, #f4f5f7 100%)", padding:20, position:"relative", overflow:"hidden", fontFamily:"'Segoe UI',sans-serif" }}>
      <div style={{ position:"absolute", inset:0, opacity:0.03, backgroundImage:"radial-gradient(circle at 25% 25%, #9a7530 1px, transparent 1px), radial-gradient(circle at 75% 75%, #9a7530 1px, transparent 1px)", backgroundSize:"60px 60px" }} />

      <div style={{ width:"100%", maxWidth:440, position:"relative", zIndex:1, textAlign:"center" }}>
        {/* Brand */}
        <div style={{ marginBottom:32 }}>
          <div style={{ width:56, height:56, margin:"0 auto 14px", borderRadius:12, background:"linear-gradient(135deg, #2563b0, #1d5a9e)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 6px 24px rgba(37,99,176,0.12)" }}>
            <span style={{ fontSize:22, fontWeight:800, color:"#fff" }}>AC</span>
          </div>
          <div style={{ fontSize:22, fontWeight:600, color:"#1a1a2e", letterSpacing:"-0.02em" }}>
            AusClear <span style={{ color:"#9a7530" }}>Corporate Connect</span><span style={{ color:"#9a7530", fontSize:13, verticalAlign:"super" }}>™</span>
          </div>
        </div>

        {/* Card */}
        <div style={{ background:"#fff", border:"1px solid #d8dce4", borderRadius:12, padding:"40px 32px", textAlign:"center" }}>
          <div style={{ width:64, height:64, margin:"0 auto 20px", borderRadius:"50%", background:"rgba(212,147,92,0.08)", border:"1px solid rgba(212,147,92,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:28 }}>🔧</span>
          </div>
          <p style={{ fontSize:18, fontWeight:600, color:"#1a1a2e", margin:"0 0 12px" }}>We'll be back shortly</p>
          <p style={{ fontSize:14, color:"#6b6b7b", lineHeight:1.7, margin:"0 0 28px" }}>{message}</p>
          <div style={{ background:"#f8f9fb", border:"1px solid #e2e4e9", borderRadius:8, padding:"14px 18px", textAlign:"left" }}>
            <p style={{ fontSize:12, fontWeight:600, color:"#9a7530", margin:"0 0 6px" }}>Need urgent assistance?</p>
            <p style={{ fontSize:13, color:"#1a1a2e", margin:0 }}>
              <a href="mailto:support@ausclear.com.au" style={{ color:"#2563b0", textDecoration:"none", fontWeight:600 }}>support@ausclear.com.au</a>
              <span style={{ color:"#a0a0a8", margin:"0 8px" }}>|</span>
              <span style={{ fontWeight:600 }}>1300 027 423</span>
            </p>
          </div>
        </div>

        <div style={{ marginTop:20 }}>
          <a href="/login" onClick={e => { e.preventDefault(); fetch("/api/admin/maintenance-check").then(r=>r.json()).then(d=>{ if(d.active) window.location.reload(); else window.location.href="/login"; }).catch(()=>window.location.reload()); }} style={{ color:"#2563b0", textDecoration:"none", fontSize:12, fontWeight:500, cursor:"pointer" }}>← Try signing in again</a>
        </div>

        <div style={{ marginTop:24 }}>
          <p style={{ fontSize:10, color:"#b0b0ba", letterSpacing:"0.1em", margin:0 }}>AUSCLEAR CORPORATE CONNECT™</p>
          <p style={{ fontSize:10, color:"#c8c8d0", marginTop:4 }}>Nephthys Pty Ltd | ABN 70 628 031 587 | DISP Accredited Sponsor</p>
        </div>
      </div>
    </div>
  );
}
