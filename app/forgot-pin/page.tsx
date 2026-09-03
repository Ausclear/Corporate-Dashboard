"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPinPage() {
  const [acct, setAcct] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("ausclear_theme");
    if (saved) { setIsDark(saved === "dark"); }
    else { setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches); }
  }, []);

  const pinsMatch = pin.length === 6 && pin === confirmPin;
  const valid = acct.trim().length >= 4 && email.includes("@") && pinsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinsMatch) { setError("PINs do not match"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_number: acct, email, new_pin: pin }),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.error || "Reset failed");
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
    cardBorder: "#1a1f2e", input: "#07070a", inputBorder: "#1a1f2e", inputFocus: "#c9a84c44",
    text: "#e8e5de", label: "#6a6a78", muted: "#5a5a68", dim: "#3a3a48", dimmer: "#2a2a38",
    gold: "#c9a84c",
    btnOff: "#1a1a22", btnOffText: "#3a3a42",
    errBg: "rgba(201,90,90,0.08)", errBorder: "rgba(201,90,90,0.2)", errText: "#c97a7a",
    green: "#5cb87a", greenBg: "rgba(92,184,122,0.1)", greenBorder: "rgba(92,184,122,0.3)",
    dotOpacity: 0.03, glowGold: "rgba(201,168,76,0.06)", glowBlue: "rgba(37,99,176,0.04)",
    shadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.08)",
    btnGrad: "linear-gradient(135deg, #c9a84c, #9a7530)", btnText: "#050508",
    iconBg: "linear-gradient(135deg, #c9a84c, #9a7530)", iconText: "#050508",
    pinFilled: "#c9a84c44",
  } : {
    bg: "linear-gradient(145deg, #f0f2f5 0%, #e8ecf0 40%, #f4f5f7 100%)",
    card: "#ffffff",
    cardBorder: "#d8dce4", input: "#f8f9fb", inputBorder: "#d8dce4", inputFocus: "#2563b066",
    text: "#1a1a2e", label: "#6b6b7b", muted: "#7a7a8a", dim: "#b0b0ba", dimmer: "#c8c8d0",
    gold: "#9a7530",
    btnOff: "#e8e8f0", btnOffText: "#a0a0a8",
    errBg: "rgba(201,90,90,0.06)", errBorder: "rgba(201,90,90,0.15)", errText: "#b85050",
    green: "#2d8a4e", greenBg: "rgba(45,138,78,0.08)", greenBorder: "rgba(45,138,78,0.3)",
    dotOpacity: 0.04, glowGold: "rgba(154,117,48,0.06)", glowBlue: "rgba(37,99,176,0.04)",
    shadow: "0 20px 60px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
    btnGrad: "linear-gradient(135deg, #2563b0, #1d5a9e)", btnText: "#ffffff",
    iconBg: "linear-gradient(135deg, #2563b0, #1d5a9e)", iconText: "#ffffff",
    pinFilled: "#2563b033",
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg, padding:"20px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, opacity:C.dotOpacity, backgroundImage:`radial-gradient(circle at 25% 25%, ${C.gold} 1px, transparent 1px), radial-gradient(circle at 75% 75%, ${C.gold} 1px, transparent 1px)`, backgroundSize:"60px 60px" }} />
      <div style={{ position:"absolute", top:"-20%", right:"-10%", width:"500px", height:"500px", background:`radial-gradient(circle, ${C.glowGold} 0%, transparent 70%)`, borderRadius:"50%" }} />
      <div style={{ position:"absolute", bottom:"-20%", left:"-10%", width:"400px", height:"400px", background:`radial-gradient(circle, ${C.glowBlue} 0%, transparent 70%)`, borderRadius:"50%" }} />

      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:56, height:56, margin:"0 auto 16px", borderRadius:"12px", background:C.iconBg, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 32px ${C.glowGold}` }}>
            <span style={{ fontSize:24, fontWeight:800, color:C.iconText }}>AC</span>
          </div>
          <h1 style={{ fontSize:28, fontWeight:700, color:C.text, margin:0, letterSpacing:"-0.02em" }}>
            AusClear <span style={{ color:C.gold }}>Corporate Connect</span><span style={{ color:C.gold, fontSize:16, verticalAlign:"super" }}>™</span>
          </h1>
          <p style={{ fontSize:13, color:C.muted, marginTop:8, letterSpacing:"0.05em" }}>Secure Clearance Management Portal</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:16, padding:"32px 28px", boxShadow:C.shadow, borderTop:`2px solid ${C.gold}` }}>
          {success ? (
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:C.greenBg, border:`1px solid ${C.greenBorder}`, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:24, marginBottom:16, color:C.green }}>✓</div>
              <h2 style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:8 }}>PIN Reset</h2>
              <p style={{ fontSize:13, color:C.muted }}>Your PIN has been reset. Redirecting to sign in...</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:8 }}>Reset PIN</h2>
              <p style={{ fontSize:12, color:C.muted, marginBottom:20 }}>Verify your account number and billing email to set a new PIN.</p>

              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:10, color:C.label, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.14em", fontWeight:600 }}>Account Number</label>
                <input value={acct} onChange={e => setAcct(e.target.value.toUpperCase())} placeholder="e.g. AB12345" autoComplete="off"
                  style={{ width:"100%", padding:"13px 16px", background:C.input, border:`1px solid ${C.inputBorder}`, borderRadius:8, color:C.text, fontSize:15, outline:"none", boxSizing:"border-box", fontFamily:"'DM Sans', monospace", fontWeight:600, letterSpacing:"0.1em", transition:"border 0.2s", WebkitTextFillColor:C.text }}
                  onFocus={e => e.target.style.borderColor = C.inputFocus} onBlur={e => e.target.style.borderColor = C.inputBorder} />
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:10, color:C.label, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.14em", fontWeight:600 }}>Contact Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="As registered with AusClear" type="email" autoComplete="off"
                  style={{ width:"100%", padding:"13px 16px", background:C.input, border:`1px solid ${C.inputBorder}`, borderRadius:8, color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", transition:"border 0.2s", WebkitTextFillColor:C.text }}
                  onFocus={e => e.target.style.borderColor = C.inputFocus} onBlur={e => e.target.style.borderColor = C.inputBorder} />
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:10, color:C.label, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.14em", fontWeight:600 }}>New 6-Digit PIN</label>
                <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                  {[0,1,2,3,4,5].map(i => (
                    <input key={i} id={`fp-${i}`} type="text" inputMode="numeric" maxLength={1} value={pin[i]||""}
                      onChange={e => { const v=e.target.value.replace(/\D/g,""); if(!v&&pin[i]){setPin(pin.slice(0,i)+pin.slice(i+1));return;} if(!v)return; setPin(pin.slice(0,i)+v[0]+pin.slice(i+1)); if(i<5)document.getElementById(`fp-${i+1}`)?.focus(); }}
                      onKeyDown={e => { if(e.key==="Backspace"&&!pin[i]&&i>0)document.getElementById(`fp-${i-1}`)?.focus(); }}
                      style={{ width:48, height:56, textAlign:"center", fontSize:22, fontWeight:700, background:C.input, border:`1px solid ${pin[i]?C.pinFilled:C.inputBorder}`, borderRadius:8, color:C.text, outline:"none", boxSizing:"border-box", transition:"all 0.2s", WebkitTextFillColor:C.text }}
                      onFocus={e => e.target.style.borderColor=C.inputFocus} onBlur={e => e.target.style.borderColor=pin[i]?C.pinFilled:C.inputBorder} />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:24 }}>
                <label style={{ display:"block", fontSize:10, color:C.label, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.14em", fontWeight:600 }}>Confirm New PIN</label>
                <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                  {[0,1,2,3,4,5].map(i => (
                    <input key={i} id={`fpc-${i}`} type="text" inputMode="numeric" maxLength={1} value={confirmPin[i]||""}
                      onChange={e => { const v=e.target.value.replace(/\D/g,""); if(!v&&confirmPin[i]){setConfirmPin(confirmPin.slice(0,i)+confirmPin.slice(i+1));return;} if(!v)return; setConfirmPin(confirmPin.slice(0,i)+v[0]+confirmPin.slice(i+1)); if(i<5)document.getElementById(`fpc-${i+1}`)?.focus(); }}
                      onKeyDown={e => { if(e.key==="Backspace"&&!confirmPin[i]&&i>0)document.getElementById(`fpc-${i-1}`)?.focus(); }}
                      style={{ width:48, height:56, textAlign:"center", fontSize:22, fontWeight:700, background:C.input, border:`1px solid ${confirmPin[i]?(confirmPin.length===6?(pinsMatch?"rgba(92,184,122,0.5)":"rgba(201,90,90,0.5)"):C.pinFilled):C.inputBorder}`, borderRadius:8, color:C.text, outline:"none", boxSizing:"border-box", transition:"all 0.2s", WebkitTextFillColor:C.text }} />
                  ))}
                </div>
                {confirmPin.length===6 && !pinsMatch && <p style={{ color:C.errText, fontSize:11, marginTop:8, textAlign:"center" }}>PINs do not match</p>}
              </div>

              {error && (
                <div style={{ background:C.errBg, border:`1px solid ${C.errBorder}`, borderRadius:8, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14 }}>⚠</span>
                  <span style={{ color:C.errText, fontSize:12 }}>{error}</span>
                </div>
              )}

              <button type="submit" disabled={!valid || loading}
                style={{ width:"100%", padding:"15px", background:valid?C.btnGrad:C.btnOff, border:"none", borderRadius:10, color:valid?C.btnText:C.btnOffText, fontSize:14, fontWeight:700, cursor:valid?"pointer":"not-allowed", transition:"all 0.3s", letterSpacing:"0.03em" }}>
                {loading ? "Resetting..." : "Reset PIN"}
              </button>

              <p style={{ textAlign:"center", marginTop:20, fontSize:12 }}>
                <a href="/login" style={{ color:C.gold, textDecoration:"none", fontWeight:500 }}>← Back to Sign In</a>
              </p>
            </>
          )}
        </form>

        <div style={{ textAlign:"center", marginTop:28 }}>
          <p style={{ fontSize:10, color:C.dim, letterSpacing:"0.1em" }}>AUSCLEAR CORPORATE CONNECT™</p>
          <p style={{ fontSize:10, color:C.dimmer, marginTop:4 }}>Nephthys Pty Ltd | ABN 70 628 031 587 | DISP Accredited Sponsor</p>
        </div>
      </div>
    </div>
  );
}
