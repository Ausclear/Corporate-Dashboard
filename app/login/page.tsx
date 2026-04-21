"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

const G = "#c9a84c";
const GB = "rgba(201,168,76,0.35)";
const BG = "#07070a";
const C = "#202028";
const I = "#16161c";
const T = "#e8e6e1";
const T2 = "#9a9898";
const M = "#6b6969";
const B = "rgba(255,255,255,0.06)";
const R = "#c0392b";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });
      if (authErr) {
        if (authErr.message.toLowerCase().includes("invalid")) {
          setError("Incorrect email or password. Please try again.");
        } else {
          setError(authErr.message);
        }
        setLoading(false); return;
      }

      // Check 2FA status
      const res = await fetch("/api/auth/check-2fa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();

      if (data.enabled) {
        router.push("/verify-2fa?email=" + encodeURIComponent(email.toLowerCase().trim()));
      } else {
        router.push("/setup-2fa?email=" + encodeURIComponent(email.toLowerCase().trim()));
      }
    } catch { setError("Something went wrong. Please try again."); }
    setLoading(false);
  };

  const inp: React.CSSProperties = {
    width: "100%", background: I, border: `1px solid ${B}`, borderRadius: 10,
    padding: "14px 18px", color: T, fontSize: 14, outline: "none", fontFamily: "inherit",
  };
  const btnStyle: React.CSSProperties = {
    width: "100%", padding: "14px", border: "none", borderRadius: 10,
    background: loading ? M : `linear-gradient(135deg, ${G}, #b8942e)`,
    color: loading ? T2 : BG, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
    fontFamily: "inherit", opacity: loading ? 0.6 : 1,
  };
  const label: React.CSSProperties = {
    fontSize: 11, color: G, textTransform: "uppercase" as const, letterSpacing: "1.5px",
    fontWeight: 700, marginBottom: 6, display: "block",
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-dm-sans, DM Sans, -apple-system, sans-serif)", padding: 16 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
        <a href="/" style={{ display: "inline-block", marginBottom: 8 }}>
          <img src="https://ausclear.au/AusClear-Light-Transparent.png" alt="AusClear" style={{ height: 36 }} />
        </a>
        <div style={{ fontSize: 10, color: G, textTransform: "uppercase", letterSpacing: "3px", fontWeight: 700, marginBottom: 36 }}>
          Corporate Portal
        </div>

        <div style={{ background: C, borderRadius: 16, padding: "36px 28px", border: `1px solid ${B}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${G}, transparent)` }} />

          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: T, margin: "0 0 6px", fontWeight: 700 }}>Sign In</h1>
          <p style={{ fontSize: 13, color: T2, margin: "0 0 28px" }}>Enter your corporate credentials to continue</p>

          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <label style={label}>Email Address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="you@company.com.au"
              onFocus={e => { e.target.style.borderColor = GB; }}
              onBlur={e => { e.target.style.borderColor = B; }}
              style={inp} autoFocus
            />
          </div>

          <div style={{ textAlign: "left", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ ...label, marginBottom: 0 }}>Password</label>
              <a href="/forgot-password" style={{ fontSize: 11, color: T2, textDecoration: "none" }}>Forgot password?</a>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
                onFocus={e => { e.target.style.borderColor = GB; }}
                onBlur={e => { e.target.style.borderColor = B; }}
                style={{ ...inp, paddingRight: 48 }}
              />
              <button onClick={() => setShowPw(v => !v)} style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: M, cursor: "pointer", fontSize: 12, padding: 4,
              }}>
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading} style={btnStyle}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {error && (
            <div style={{ background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.3)", borderRadius: 10, padding: "12px 16px", marginTop: 16, textAlign: "left" }}>
              <p style={{ fontSize: 13, color: R, margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${B}`, textAlign: "center" }}>
            <span style={{ fontSize: 13, color: T2 }}>Don&apos;t have an account? </span>
            <a href="/register" style={{ fontSize: 13, color: G, fontWeight: 700, textDecoration: "none" }}>Create account</a>
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 11, color: M }}>Nephthys Pty Ltd (ACN 628 031 587) trading as AusClear</p>
          <p style={{ fontSize: 11, color: M, marginTop: 4 }}>1300 027 423 · support@ausclear.com.au</p>
        </div>
      </div>

      <style>{`* { box-sizing: border-box; } html, body { margin: 0; padding: 0; background: ${BG}; } input::placeholder { color: ${M}; }`}</style>
    </div>
  );
}
