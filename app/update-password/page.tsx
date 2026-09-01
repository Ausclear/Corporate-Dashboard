"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

const G = "#c9a84c"; const GB = "rgba(201,168,76,0.35)";
const BG = "#07070a"; const C = "#202028"; const I = "#16161c";
const T = "#e8e6e1"; const T2 = "#9a9898"; const M = "#6b6969";
const B = "rgba(255,255,255,0.06)"; const R = "#c0392b"; const GR = "#27ae60";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleUpdate = async () => {
    setError("");
    if (!password || password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const { error: e } = await supabase.auth.updateUser({ password });
      if (e) { setError(e.message); } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch { setError("Something went wrong."); }
    setLoading(false);
  };

  const inp: React.CSSProperties = {
    width: "100%", background: I, border: `1px solid ${B}`, borderRadius: 10,
    padding: "14px 18px", color: T, fontSize: 14, outline: "none", fontFamily: "inherit",
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-dm-sans, DM Sans, -apple-system, sans-serif)", padding: 16 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
        <a href="/" style={{ display: "inline-block", marginBottom: 8 }}>
          <img src="https://ausclear.au/AusClear-Light-Transparent.png" alt="AusClear" style={{ height: 36 }} />
        </a>
        <div style={{ fontSize: 10, color: G, textTransform: "uppercase", letterSpacing: "3px", fontWeight: 700, marginBottom: 36 }}>Corporate Portal</div>
        <div style={{ background: C, borderRadius: 16, padding: "36px 28px", border: `1px solid ${B}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${G}, transparent)` }} />
          {!success ? (
            <>
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: T, margin: "0 0 6px", fontWeight: 700 }}>Set New Password</h1>
              <p style={{ fontSize: 13, color: T2, margin: "0 0 28px" }}>Choose a strong password for your account</p>
              <div style={{ textAlign: "left", marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: G, textTransform: "uppercase" as const, letterSpacing: "1.5px", fontWeight: 700, marginBottom: 6, display: "block" }}>New Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    onFocus={e => { e.target.style.borderColor = GB; }} onBlur={e => { e.target.style.borderColor = B; }}
                    style={{ ...inp, paddingRight: 48 }}
                  />
                  <button onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: M, cursor: "pointer", fontSize: 12 }}>
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div style={{ textAlign: "left", marginBottom: 24 }}>
                <label style={{ fontSize: 11, color: G, textTransform: "uppercase" as const, letterSpacing: "1.5px", fontWeight: 700, marginBottom: 6, display: "block" }}>Confirm Password</label>
                <input type={showPw ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleUpdate()}
                  placeholder="Re-enter password"
                  onFocus={e => { e.target.style.borderColor = GB; }} onBlur={e => { e.target.style.borderColor = B; }}
                  style={{ ...inp, borderColor: confirm && confirm !== password ? R : B }}
                />
              </div>
              <button onClick={handleUpdate} disabled={loading} style={{
                width: "100%", padding: "14px", border: "none", borderRadius: 10,
                background: loading ? M : `linear-gradient(135deg, ${G}, #b8942e)`,
                color: loading ? T2 : BG, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}>
                {loading ? "Updating..." : "Update Password"}
              </button>
              {error && <div style={{ background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.3)", borderRadius: 10, padding: "12px 16px", marginTop: 16, textAlign: "left" }}><p style={{ fontSize: 13, color: R, margin: 0 }}>{error}</p></div>}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, color: GR, margin: "0 0 12px" }}>Password Updated</h2>
              <p style={{ fontSize: 13, color: T2 }}>Redirecting to sign in...</p>
            </div>
          )}
        </div>
        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 11, color: M }}>Nephthys Pty Ltd (ACN 628 031 587) trading as AusClear</p>
        </div>
      </div>
      <style>{`* { box-sizing: border-box; } html, body { margin: 0; padding: 0; background: ${BG}; } input::placeholder { color: ${M}; }`}</style>
    </div>
  );
}
