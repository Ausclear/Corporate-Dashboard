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
const GR = "#27ae60";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const pwStrength = (pw: string) => {
    if (!pw) return { score: 0, label: "", color: M };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score, label: "Weak", color: R };
    if (score <= 3) return { score, label: "Fair", color: "#e67e22" };
    return { score, label: "Strong", color: GR };
  };

  const strength = pwStrength(password);

  const handleRegister = async () => {
    setError(""); setSuccess("");
    const em = email.toLowerCase().trim();
    if (!em || !em.includes("@")) { setError("Please enter a valid email address."); return; }
    if (!password || password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPw) { setError("Passwords do not match."); return; }
    if (strength.score < 2) { setError("Please choose a stronger password."); return; }

    setLoading(true);
    try {
      // Check email is on the approved list
      const checkRes = await fetch("/api/auth/check-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
      });
      const checkData = await checkRes.json();
      if (!checkData.authorised) {
        setError("This email address is not associated with a corporate AusClear account. Please contact us on 1300 027 423.");
        setLoading(false); return;
      }

      const { error: authErr } = await supabase.auth.signUp({
        email: em,
        password,
        options: { data: { company_name: checkData.company_name } },
      });

      if (authErr) {
        if (authErr.message.includes("already registered")) {
          setError("An account with this email already exists. Please sign in instead.");
        } else {
          setError(authErr.message);
        }
        setLoading(false); return;
      }

      // Immediately sign in so session exists for 2FA setup
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email: em, password });
      if (loginErr) {
        setSuccess("Account created! Please check your email to confirm, then sign in.");
        setLoading(false); return;
      }

      router.push("/setup-2fa?email=" + encodeURIComponent(em));
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

      <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
        <a href="/" style={{ display: "inline-block", marginBottom: 8 }}>
          <img src="https://ausclear.au/AusClear-Light-Transparent.png" alt="AusClear" style={{ height: 36 }} />
        </a>
        <div style={{ fontSize: 10, color: G, textTransform: "uppercase", letterSpacing: "3px", fontWeight: 700, marginBottom: 36 }}>
          Corporate Portal
        </div>

        <div style={{ background: C, borderRadius: 16, padding: "36px 28px", border: `1px solid ${B}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${G}, transparent)` }} />

          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: T, margin: "0 0 6px", fontWeight: 700 }}>Create Account</h1>
          <p style={{ fontSize: 13, color: T2, margin: "0 0 28px" }}>Your email must be registered with AusClear to proceed</p>

          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <label style={label}>Email Address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleRegister()}
              placeholder="you@company.com.au"
              onFocus={e => { e.target.style.borderColor = GB; }}
              onBlur={e => { e.target.style.borderColor = B; }}
              style={inp} autoFocus
            />
          </div>

          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <label style={label}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleRegister()}
                placeholder="Minimum 8 characters"
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
            {password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= strength.score ? strength.color : B,
                      transition: "background 0.2s",
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>

          <div style={{ textAlign: "left", marginBottom: 24 }}>
            <label style={label}>Confirm Password</label>
            <input
              type={showPw ? "text" : "password"} value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleRegister()}
              placeholder="Re-enter password"
              onFocus={e => { e.target.style.borderColor = GB; }}
              onBlur={e => { e.target.style.borderColor = B; }}
              style={{ ...inp, borderColor: confirmPw && confirmPw !== password ? R : B }}
            />
          </div>

          <div style={{ background: "rgba(201,168,76,0.08)", border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, textAlign: "left" }}>
            <p style={{ fontSize: 12, color: T2, margin: 0, lineHeight: 1.5 }}>
              🔐 Two-factor authentication is <strong style={{ color: T }}>mandatory</strong> for all accounts. You will be prompted to set it up after registration.
            </p>
          </div>

          <button onClick={handleRegister} disabled={loading} style={btnStyle}>
            {loading ? "Creating account..." : "Create Account"}
          </button>

          {error && (
            <div style={{ background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.3)", borderRadius: 10, padding: "12px 16px", marginTop: 16, textAlign: "left" }}>
              <p style={{ fontSize: 13, color: R, margin: 0 }}>{error}</p>
            </div>
          )}
          {success && (
            <div style={{ background: "rgba(39,174,96,0.1)", border: "1px solid rgba(39,174,96,0.3)", borderRadius: 10, padding: "12px 16px", marginTop: 16, textAlign: "left" }}>
              <p style={{ fontSize: 13, color: GR, margin: 0 }}>{success}</p>
            </div>
          )}

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${B}`, textAlign: "center" }}>
            <span style={{ fontSize: 13, color: T2 }}>Already have an account? </span>
            <a href="/login" style={{ fontSize: 13, color: G, fontWeight: 700, textDecoration: "none" }}>Sign in</a>
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
