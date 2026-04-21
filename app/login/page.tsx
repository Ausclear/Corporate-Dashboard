"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

const G = "#c9a84c";
const GD = "rgba(201,168,76,0.15)";
const GB = "rgba(201,168,76,0.25)";
const BG = "#07070a";
const C = "#202028";
const I = "#16161c";
const T = "#e8e6e1";
const T2 = "#9a9898";
const M = "#6b6969";
const B = "rgba(255,255,255,0.06)";
const GR = "#27ae60";
const R = "#c0392b";

type Step = "email" | "otp" | "2fa-setup" | "2fa-verify";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [totpCode, setTotpCode] = useState(["", "", "", "", "", ""]);
  const [qrUrl, setQrUrl] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const totpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // Focus first OTP input when step changes
  useEffect(() => {
    if (step === "otp") setTimeout(() => otpRefs.current[0]?.focus(), 100);
    if (step === "2fa-verify") setTimeout(() => totpRefs.current[0]?.focus(), 100);
  }, [step]);

  /* ── Step 1: Email submit ── */
  const handleEmailSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    const em = email.toLowerCase().trim();
    if (!em || !em.includes("@")) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
      });
      const data = await res.json();
      if (!data.authorised) {
        setError("This email is not associated with a corporate account. Contact AusClear on 1300 027 423.");
        setLoading(false); return;
      }
      setCompanyName(data.company_name || "");

      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: em, options: { shouldCreateUser: true },
      });
      if (otpErr) { setError(otpErr.message); setLoading(false); return; }

      setStep("otp");
      setCountdown(60);
    } catch { setError("Something went wrong. Please try again."); }
    setLoading(false);
  };

  /* ── OTP input handlers ── */
  const handleCodeInput = (
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    state: string[],
    setState: (v: string[]) => void,
    onComplete: (code: string) => void,
    index: number,
    value: string
  ) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...state];
    next[index] = value.slice(-1);
    setState(next);
    if (value && index < 5) refs.current[index + 1]?.focus();
    if (next.every(d => d !== "") && next.join("").length === 6) onComplete(next.join(""));
  };

  const handleCodeKeyDown = (
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    state: string[],
    index: number,
    e: React.KeyboardEvent
  ) => {
    if (e.key === "Backspace" && !state[index] && index > 0) refs.current[index - 1]?.focus();
  };

  const handleCodePaste = (
    setState: (v: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    onComplete: (code: string) => void,
    e: React.ClipboardEvent
  ) => {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (p.length === 6) {
      setState(p.split(""));
      refs.current[5]?.focus();
      onComplete(p);
    }
  };

  /* ── Step 2: Verify OTP ── */
  const verifyOtp = async (code: string) => {
    setError(""); setLoading(true);
    try {
      const { error: vErr } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(), token: code, type: "email",
      });
      if (vErr) {
        setError("Invalid code. Please check your email and try again.");
        setOtp(["", "", "", "", "", ""]); otpRefs.current[0]?.focus();
        setLoading(false); return;
      }

      // Check 2FA status
      const res = await fetch("/api/auth/check-2fa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();

      if (data.enabled) {
        setStep("2fa-verify");
      } else {
        // Need to set up 2FA first
        await setup2FA();
        setStep("2fa-setup");
      }
    } catch { setError("Verification failed."); }
    setLoading(false);
  };

  /* ── Step 3a: Setup 2FA ── */
  const setup2FA = async () => {
    try {
      const res = await fetch("/api/auth/setup-2fa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (data.qr) { setQrUrl(data.qr); setTotpSecret(data.secret); }
      else setError(data.error || "Failed to set up 2FA.");
    } catch { setError("Failed to set up 2FA."); }
  };

  /* ── Step 3b/4: Verify TOTP ── */
  const verifyTotp = async (code: string) => {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), code }),
      });
      const data = await res.json();
      if (!data.valid) {
        setError(data.error || "Invalid code.");
        setTotpCode(["", "", "", "", "", ""]); totpRefs.current[0]?.focus();
        setLoading(false); return;
      }
      router.push("/");
      router.refresh();
    } catch { setError("Verification failed."); }
    setLoading(false);
  };

  const resendOtp = async () => {
    if (countdown > 0) return;
    setLoading(true); setError("");
    const { error: e } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(), options: { shouldCreateUser: true },
    });
    if (e) setError(e.message); else setCountdown(60);
    setLoading(false);
  };

  /* ── Shared styles ── */
  const inp: React.CSSProperties = {
    width: "100%", background: I, border: `1px solid ${B}`, borderRadius: 10,
    padding: "14px 18px", color: T, fontSize: 14, outline: "none", fontFamily: "inherit",
  };
  const btn = (disabled?: boolean): React.CSSProperties => ({
    width: "100%", padding: "14px", border: "none", borderRadius: 10,
    background: disabled ? M : `linear-gradient(135deg, ${G}, #b8942e)`,
    color: disabled ? T2 : BG, fontWeight: 700, fontSize: 14, cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit", opacity: disabled ? 0.5 : 1,
  });
  const codeBox: React.CSSProperties = {
    width: 44, height: 52, background: I, border: `1px solid ${B}`, borderRadius: 10,
    textAlign: "center", fontSize: 22, fontWeight: 700, color: T, outline: "none",
    fontFamily: "Georgia, serif",
  };

  const renderCodeInputs = (
    state: string[],
    setState: (v: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    onComplete: (code: string) => void
  ) => (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "20px 0" }}>
      {state.map((d, i) => (
        <input
          key={i} ref={el => { refs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={e => handleCodeInput(refs, state, setState, onComplete, i, e.target.value)}
          onKeyDown={e => handleCodeKeyDown(refs, state, i, e)}
          onPaste={e => handleCodePaste(setState, refs, onComplete, e)}
          onFocus={e => { e.target.style.borderColor = GB; }}
          onBlur={e => { e.target.style.borderColor = B; }}
          style={codeBox}
        />
      ))}
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', -apple-system, sans-serif", padding: 16,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
        <img src="https://ausclear.au/AusClear-Light-Transparent.png" alt="AusClear" style={{ height: 36, marginBottom: 8 }} />
        <div style={{ fontSize: 10, color: G, textTransform: "uppercase", letterSpacing: "3px", fontWeight: 700, marginBottom: 36 }}>
          Corporate Portal
        </div>

        <div style={{
          background: C, borderRadius: 16, padding: "36px 28px", border: `1px solid ${B}`,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${G}, transparent)` }} />

          {/* ── STEP: EMAIL ── */}
          {step === "email" && (
            <div>
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: T, margin: "0 0 6px", fontWeight: 700 }}>Sign In</h1>
              <p style={{ fontSize: 13, color: T2, margin: "0 0 28px" }}>Enter your corporate email to continue</p>
              <div style={{ textAlign: "left", marginBottom: 18 }}>
                <label style={{ fontSize: 11, color: G, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: 6, display: "block" }}>Email Address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleEmailSubmit()}
                  placeholder="you@company.com.au"
                  onFocus={e => { e.target.style.borderColor = GB; }}
                  onBlur={e => { e.target.style.borderColor = B; }}
                  style={inp} autoFocus
                />
              </div>
              <button onClick={() => handleEmailSubmit()} disabled={loading} style={btn(loading)}>
                {loading ? "Sending code..." : "Continue"}
              </button>
            </div>
          )}

          {/* ── STEP: OTP ── */}
          {step === "otp" && (
            <div>
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: T, margin: "0 0 6px", fontWeight: 700 }}>Check Your Email</h1>
              <p style={{ fontSize: 13, color: T2, margin: "0 0 4px" }}>
                We&apos;ve sent a 6-digit code to
              </p>
              <p style={{ fontSize: 13, color: G, fontWeight: 700, margin: "0 0 4px", fontFamily: "monospace" }}>{email}</p>
              {companyName && <p style={{ fontSize: 12, color: M, margin: "0 0 0" }}>{companyName}</p>}

              {renderCodeInputs(otp, setOtp, otpRefs, verifyOtp)}

              {loading && <p style={{ fontSize: 12, color: G, margin: "0 0 12px" }}>Verifying...</p>}

              <div style={{ marginTop: 16 }}>
                <button onClick={resendOtp} disabled={countdown > 0} style={{
                  background: "none", border: "none", color: countdown > 0 ? M : G,
                  fontSize: 13, cursor: countdown > 0 ? "default" : "pointer", fontFamily: "inherit",
                  textDecoration: countdown > 0 ? "none" : "underline",
                }}>
                  {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
                </button>
              </div>

              <button onClick={() => { setStep("email"); setOtp(["","","","","",""]); setError(""); }}
                style={{ background: "none", border: "none", color: T2, fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>
                ← Use a different email
              </button>
            </div>
          )}

          {/* ── STEP: 2FA SETUP ── */}
          {step === "2fa-setup" && (
            <div>
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: 20, color: T, margin: "0 0 6px", fontWeight: 700 }}>Set Up Two-Factor Authentication</h1>
              <p style={{ fontSize: 13, color: T2, margin: "0 0 20px" }}>
                2FA is mandatory for all corporate accounts. Scan the QR code with your authenticator app.
              </p>

              {qrUrl && (
                <div style={{ background: I, borderRadius: 12, padding: 16, display: "inline-block", marginBottom: 16 }}>
                  <img src={qrUrl} alt="2FA QR Code" style={{ width: 200, height: 200, display: "block" }} />
                </div>
              )}

              <div style={{ textAlign: "left", marginBottom: 16 }}>
                <label style={{ fontSize: 10, color: M, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 4 }}>Manual entry key</label>
                <div style={{
                  background: I, border: `1px solid ${B}`, borderRadius: 8, padding: "10px 14px",
                  fontFamily: "monospace", fontSize: 12, color: G, letterSpacing: "1px", wordBreak: "break-all",
                  userSelect: "all",
                }}>
                  {totpSecret}
                </div>
              </div>

              <p style={{ fontSize: 12, color: T2, margin: "0 0 12px", textAlign: "left" }}>
                Enter the 6-digit code from your authenticator app to confirm setup:
              </p>

              {renderCodeInputs(totpCode, setTotpCode, totpRefs, verifyTotp)}

              {loading && <p style={{ fontSize: 12, color: G }}>Verifying...</p>}
            </div>
          )}

          {/* ── STEP: 2FA VERIFY ── */}
          {step === "2fa-verify" && (
            <div>
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: T, margin: "0 0 6px", fontWeight: 700 }}>Two-Factor Authentication</h1>
              <p style={{ fontSize: 13, color: T2, margin: "0 0 4px" }}>
                Enter the 6-digit code from your authenticator app
              </p>
              {companyName && <p style={{ fontSize: 12, color: M, margin: "0 0 0" }}>{companyName}</p>}

              {renderCodeInputs(totpCode, setTotpCode, totpRefs, verifyTotp)}

              {loading && <p style={{ fontSize: 12, color: G }}>Verifying...</p>}

              <button onClick={() => { setStep("email"); setOtp(["","","","","",""]); setTotpCode(["","","","","",""]); setError(""); }}
                style={{ background: "none", border: "none", color: T2, fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginTop: 12 }}>
                ← Start again
              </button>
            </div>
          )}

          {/* ── ERROR ── */}
          {error && (
            <div style={{
              background: "rgba(192,57,43,0.1)", border: `1px solid rgba(192,57,43,0.3)`,
              borderRadius: 10, padding: "12px 16px", marginTop: 16, textAlign: "left",
            }}>
              <p style={{ fontSize: 13, color: R, margin: 0 }}>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 11, color: M }}>
            Nephthys Pty Ltd (ACN 628 031 587) trading as AusClear
          </p>
          <p style={{ fontSize: 11, color: M, marginTop: 4 }}>
            1300&nbsp;027&nbsp;423 &nbsp;·&nbsp; support@ausclear.com.au
          </p>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: ${BG}; }
        input::placeholder { color: ${M}; }
      `}</style>
    </div>
  );
}
