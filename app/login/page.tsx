"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [acct, setAcct] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Check saved theme, fallback to system preference
    const saved = localStorage.getItem("ausclear_theme");
    if (saved) { setIsDark(saved === "dark"); }
    else { setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches); }
  }, []);

  const valid = acct.trim().length >= 4 && name.trim().length >= 2 && pin.length === 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_number: acct, contact_name: name, pin }),
      });
      const data = await res.json();
      if (data.ok) {
        sessionStorage.setItem("account_number", data.account_number);
        router.replace("/dashboard");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  if (!mounted) return null;

  const C = isDark ? {
    bg: "linear-gradient(145deg, #050508 0%, #0a0d14 40%, #0d1018 100%)",
    card: "linear-gradient(180deg, #111318 0%, #0e1118 100%)",
    cardBorder: "#1a1f2e",
    input: "#07070a",
    inputBorder: "#1a1f2e",
    inputFocus: "#c9a84c44",
    text: "#e8e5de",
    label: "#6a6a78",
    muted: "#5a5a68",
    dim: "#3a3a48",
    dimmer: "#2a2a38",
    gold: "#c9a84c",
    goldDark: "#9a7530",
    btnOff: "#1a1a22",
    btnOffText: "#3a3a42",
    errBg: "rgba(201,90,90,0.08)",
    errBorder: "rgba(201,90,90,0.2)",
    errText: "#c97a7a",
    dotOpacity: 0.03,
    glowGold: "rgba(201,168,76,0.06)",
    glowBlue: "rgba(37,99,176,0.04)",
    shadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.08)",
    btnShadow: "0 4px 20px rgba(201,168,76,0.25)",
    iconBg: "linear-gradient(135deg, #c9a84c, #9a7530)",
    iconText: "#050508",
    btnGrad: "linear-gradient(135deg, #c9a84c, #9a7530)",
    btnText: "#050508",
    pinFilled: "#c9a84c44",
  } : {
    bg: "linear-gradient(145deg, #f0f2f5 0%, #e8ecf0 40%, #f4f5f7 100%)",
    card: "#ffffff",
    cardBorder: "#d8dce4",
    input: "#f8f9fb",
    inputBorder: "#d8dce4",
    inputFocus: "#2563b066",
    text: "#1a1a2e",
    label: "#6b6b7b",
    muted: "#7a7a8a",
    dim: "#b0b0ba",
    dimmer: "#c8c8d0",
    gold: "#9a7530",
    goldDark: "#7a5a20",
    btnOff: "#e8e8f0",
    btnOffText: "#a0a0a8",
    errBg: "rgba(201,90,90,0.06)",
    errBorder: "rgba(201,90,90,0.15)",
    errText: "#b85050",
    dotOpacity: 0.04,
    glowGold: "rgba(154,117,48,0.06)",
    glowBlue: "rgba(37,99,176,0.04)",
    shadow: "0 20px 60px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
    btnShadow: "0 4px 20px rgba(37,99,176,0.15)",
    iconBg: "linear-gradient(135deg, #2563b0, #1d5a9e)",
    iconText: "#ffffff",
    btnGrad: "linear-gradient(135deg, #2563b0, #1d5a9e)",
    btnText: "#ffffff",
    pinFilled: "#2563b033",
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg, padding:"20px", position:"relative", overflow:"hidden" }}>
      {/* Background pattern */}
      <div style={{ position:"absolute", inset:0, opacity:C.dotOpacity, backgroundImage:`radial-gradient(circle at 25% 25%, ${C.gold} 1px, transparent 1px), radial-gradient(circle at 75% 75%, ${C.gold} 1px, transparent 1px)`, backgroundSize:"60px 60px" }} />
      <div style={{ position:"absolute", top:"-20%", right:"-10%", width:"500px", height:"500px", background:`radial-gradient(circle, ${C.glowGold} 0%, transparent 70%)`, borderRadius:"50%" }} />
      <div style={{ position:"absolute", bottom:"-20%", left:"-10%", width:"400px", height:"400px", background:`radial-gradient(circle, ${C.glowBlue} 0%, transparent 70%)`, borderRadius:"50%" }} />

      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }}>
        {/* Brand header */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:56, height:56, margin:"0 auto 16px", borderRadius:"12px", background:C.iconBg, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 32px ${C.glowGold}` }}>
            <span style={{ fontSize:24, fontWeight:800, color:C.iconText }}>AC</span>
          </div>
          <h1 style={{ fontSize:28, fontWeight:700, color:C.text, margin:0, letterSpacing:"-0.02em" }}>
            AusClear <span style={{ color:C.gold }}>Corporate Connect</span><span style={{ color:C.gold, fontSize:16, verticalAlign:"super" }}>™</span>
          </h1>
          <p style={{ fontSize:13, color:C.muted, marginTop:8, letterSpacing:"0.05em" }}>Secure Clearance Management Portal</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:16, padding:"32px 28px", boxShadow:C.shadow, borderTop:`2px solid ${C.gold}` }}>

          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", fontSize:10, color:C.label, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.14em", fontWeight:600 }}>Account Number</label>
            <input value={acct} onChange={e => setAcct(e.target.value.toUpperCase())} placeholder="e.g. AB12345"
              autoComplete="off"
              style={{ width:"100%", padding:"13px 16px", background:C.input, border:`1px solid ${C.inputBorder}`, borderRadius:8, color:C.text, fontSize:15, outline:"none", boxSizing:"border-box", fontFamily:"'DM Sans', monospace", fontWeight:600, letterSpacing:"0.1em", transition:"border 0.2s", WebkitTextFillColor:C.text }}
              onFocus={e => e.target.style.borderColor = C.inputFocus}
              onBlur={e => e.target.style.borderColor = C.inputBorder} />
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", fontSize:10, color:C.label, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.14em", fontWeight:600 }}>Authorised Contact Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="As registered with AusClear"
              autoComplete="off"
              style={{ width:"100%", padding:"13px 16px", background:C.input, border:`1px solid ${C.inputBorder}`, borderRadius:8, color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit", transition:"border 0.2s", WebkitTextFillColor:C.text }}
              onFocus={e => e.target.style.borderColor = C.inputFocus}
              onBlur={e => e.target.style.borderColor = C.inputBorder} />
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ display:"block", fontSize:10, color:C.label, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.14em", fontWeight:600 }}>6-Digit Security PIN</label>
            <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
              {[0,1,2,3,4,5].map(i => (
                <input key={i} id={`pin-${i}`} type="text" inputMode="numeric" maxLength={1}
                  value={pin[i] || ""}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, "");
                    if (!v && pin[i]) { const p = pin.slice(0,i) + pin.slice(i+1); setPin(p); return; }
                    if (!v) return;
                    const p = pin.slice(0,i) + v[0] + pin.slice(i+1);
                    setPin(p);
                    if (i < 5) document.getElementById(`pin-${i+1}`)?.focus();
                  }}
                  onKeyDown={e => {
                    if (e.key === "Backspace" && !pin[i] && i > 0) document.getElementById(`pin-${i-1}`)?.focus();
                  }}
                  style={{ width:48, height:56, textAlign:"center", fontSize:22, fontWeight:700, background:C.input, border:`1px solid ${pin[i] ? C.pinFilled : C.inputBorder}`, borderRadius:8, color:C.text, outline:"none", boxSizing:"border-box", transition:"all 0.2s", WebkitTextFillColor:C.text }}
                  onFocus={e => e.target.style.borderColor = C.inputFocus}
                  onBlur={e => e.target.style.borderColor = pin[i] ? C.pinFilled : C.inputBorder} />
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background:C.errBg, border:`1px solid ${C.errBorder}`, borderRadius:8, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:14 }}>⚠</span>
              <span style={{ color:C.errText, fontSize:12 }}>{error}</span>
            </div>
          )}

          <button type="submit" disabled={!valid || loading}
            style={{ width:"100%", padding:"15px", background:valid ? C.btnGrad : C.btnOff, border:"none", borderRadius:10, color:valid ? C.btnText : C.btnOffText, fontSize:14, fontWeight:700, cursor:valid ? "pointer" : "not-allowed", transition:"all 0.3s", boxShadow:valid ? C.btnShadow : "none", letterSpacing:"0.03em" }}>
            {loading ? "Verifying..." : "Sign In"}
          </button>

          <div style={{ display:"flex", justifyContent:"space-between", marginTop:20, padding:"0 4px" }}>
            <a href="/register" style={{ color:C.gold, textDecoration:"none", fontSize:12, fontWeight:500 }}>Register →</a>
            <a href="/forgot-pin" style={{ color:C.muted, textDecoration:"none", fontSize:12 }}>Forgot PIN?</a>
          </div>
        </form>

        {/* Footer */}
        <div style={{ textAlign:"center", marginTop:28 }}>
          <p style={{ fontSize:10, color:C.dim, letterSpacing:"0.1em" }}>AUSCLEAR CORPORATE CONNECT™</p>
          <p style={{ fontSize:10, color:C.dimmer, marginTop:4 }}>Nephthys Pty Ltd | ABN 70 628 031 587 | DISP Accredited Sponsor</p>
        </div>
      </div>
    </div>
  );
}
