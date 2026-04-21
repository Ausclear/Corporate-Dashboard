"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, Shield, CheckCircle, FileText, MessageSquare, AlertCircle, Smartphone, Copy, Check } from "lucide-react";
import QRCode from "qrcode";

type Step = "login" | "2fa" | "setup-2fa";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [twoFASecret, setTwoFASecret] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset flow
  const [resetFlow, setResetFlow] = useState<"none" | "email" | "sent">("none");
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const pwStrength = (pw: string) => {
    if (!pw) return { score: 0, label: "", color: "" };
    let s = 0;
    if (pw.length >= 8) s++; if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 1) return { score: s, label: "Weak", color: "#ef4444" };
    if (s <= 3) return { score: s, label: "Fair", color: "#f59e0b" };
    return { score: s, label: "Strong", color: "#22c55e" };
  };
  const strength = pwStrength(password);

  // Focus 2FA input when step changes
  const twoFARef = useRef<HTMLInputElement>(null);
  const setupRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (step === "2fa") setTimeout(() => twoFARef.current?.focus(), 100);
    if (step === "setup-2fa") setTimeout(() => setupRef.current?.focus(), 100);
  }, [step]);

  /* ── Step 1: Login ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("All fields are required."); return; }
    setLoading(true);
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(), password,
      });
      if (authErr) {
        setError(authErr.message.toLowerCase().includes("invalid")
          ? "Incorrect email or password. Please try again."
          : authErr.message);
        setLoading(false); return;
      }

      // Check 2FA status
      const res = await fetch("/api/auth/check-2fa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();

      if (data.enabled) {
        setStep("2fa");
      } else {
        // Need to set up 2FA — fetch QR code
        await loadSetup2FA();
        setStep("setup-2fa");
      }
    } catch { setError("An error occurred. Please try again."); }
    setLoading(false);
  };

  /* ── Load 2FA setup ── */
  const loadSetup2FA = async () => {
    try {
      const res = await fetch("/api/auth/setup-2fa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (data.qr) { setQrCodeUrl(data.qr); setTwoFASecret(data.secret); }
      else setError(data.error || "Failed to generate 2FA setup.");
    } catch { setError("Failed to load 2FA setup."); }
  };

  /* ── Step 2: Verify 2FA ── */
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (twoFACode.length !== 6) { setError("Please enter a valid 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), code: twoFACode }),
      });
      const data = await res.json();
      if (!data.valid) {
        setError(data.error || "Invalid code. Please try again.");
        setTwoFACode("");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch { setError("Verification failed. Please try again."); }
    setLoading(false);
  };

  /* ── Step 3: Complete 2FA setup ── */
  const handleSetup2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (setupCode.length !== 6) { setError("Please enter a valid 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), code: setupCode }),
      });
      const data = await res.json();
      if (!data.valid) {
        setError(data.error || "Invalid code. Please try again.");
        setSetupCode("");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch { setError("Verification failed. Please try again."); }
    setLoading(false);
  };

  /* ── Password reset ── */
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetLoading(true);
    try {
      const { error: e } = await supabase.auth.resetPasswordForEmail(resetEmail.toLowerCase().trim(), {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (e) { setError(e.message); } else { setResetFlow("sent"); }
    } catch { setError("An error occurred. Please try again."); }
    setResetLoading(false);
  };

  const copySecret = () => {
    navigator.clipboard.writeText(twoFASecret);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const features = [
    { icon: CheckCircle, title: "Manage Your Workforce", desc: "View and track all sponsored personnel in one place" },
    { icon: FileText, title: "Clearance Oversight", desc: "Monitor clearance levels, stages, and revalidation dates" },
    { icon: MessageSquare, title: "Nominate Employees", desc: "Submit new clearance nominations directly to AusClear" },
    { icon: Shield, title: "Secure & Accredited", desc: "DISP-accredited platform built for Australian defence industry" },
  ];

  return (
    <div className="min-h-screen bg-portal-bg relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-portal-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-portal-gold/5 rounded-full blur-3xl pointer-events-none" />

      {/* Reset password modal */}
      {resetFlow !== "none" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-portal-card rounded-3xl shadow-2xl p-8 max-w-md w-full border border-portal-border">
            {resetFlow === "email" ? (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-portal-gold rounded-2xl shadow-lg shadow-portal-gold/20 mb-4">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-portal-gold mb-2">Reset Password</h2>
                  <p className="text-portal-text-muted">Enter your email and we&apos;ll send a reset link</p>
                </div>
                {error && <div className="mb-4 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl"><p className="text-sm text-red-400">{error}</p></div>}
                <form onSubmit={handleResetRequest} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-portal-gold mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-portal-text-muted" />
                      <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-portal-input border border-portal-border rounded-xl focus:ring-2 focus:ring-portal-gold-soft focus:border-portal-gold-border outline-none transition-all text-portal-text-primary placeholder:text-portal-text-muted"
                        placeholder="you@company.com.au" autoFocus required />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setResetFlow("none"); setError(""); }}
                      className="flex-1 py-3.5 bg-portal-input text-portal-gold font-semibold rounded-xl transition-all">Cancel</button>
                    <button type="submit" disabled={resetLoading}
                      className="flex-1 py-3.5 bg-portal-gold hover:bg-portal-gold/90 text-[#0b0b0f] font-semibold rounded-xl disabled:opacity-50 shadow-lg shadow-portal-gold/20">
                      {resetLoading ? "Sending..." : "Send Link"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-portal-gold rounded-2xl shadow-lg shadow-portal-gold/20 mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-portal-gold mb-2">Check Your Inbox</h2>
                <p className="text-portal-text-muted mb-6">If <span className="text-portal-gold font-semibold">{resetEmail}</span> is registered, you&apos;ll receive a reset link shortly.</p>
                <button onClick={() => { setResetFlow("none"); setResetEmail(""); }}
                  className="w-full py-3.5 bg-portal-gold hover:bg-portal-gold/90 text-[#0b0b0f] font-semibold rounded-xl shadow-lg shadow-portal-gold/20">Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile header */}
      <div className="lg:hidden pt-8 pb-4 px-6 text-center">
        <img src="https://ausclear.au/AusClear-Dark-Transparent.png" alt="AusClear" className="h-16 w-auto mx-auto mb-2" />
        <p className="text-portal-gold text-sm font-semibold tracking-wide font-serif">Corporate Portal</p>
      </div>

      <div className="split-layout flex flex-col lg:flex-row relative z-10">
        {/* Left — marketing */}
        <div className="marketing-section hidden lg:flex flex-col justify-center px-12 py-12 bg-portal-card border-r border-portal-border relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-portal-gold via-portal-gold to-transparent" />
          <div className="max-w-xl relative z-10">
            <img src="https://ausclear.au/AusClear-Dark-Transparent.png" alt="AusClear" className="h-20 w-auto mb-8" />
            {step === "login" && (
              <>
                <h2 className="text-3xl font-serif font-bold text-portal-text-primary mb-4">
                  Manage Your Security<br /><span className="text-portal-gold">Clearance Programme</span>
                </h2>
                <p className="text-portal-text-muted text-lg mb-8">
                  The AusClear corporate dashboard gives your security team complete visibility over sponsored clearances, applications, and compliance obligations.
                </p>
                <div className="space-y-4 max-w-md">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-portal-input border border-portal-border hover:border-portal-gold-border transition-all duration-200">
                      <div className="flex-shrink-0 w-10 h-10 bg-portal-gold-soft border border-portal-gold-border rounded-xl flex items-center justify-center">
                        <f.icon className="w-5 h-5 text-portal-gold" />
                      </div>
                      <div>
                        <h3 className="text-portal-text-primary font-semibold text-base mb-1">{f.title}</h3>
                        <p className="text-portal-text-muted text-sm">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {step === "2fa" && (
              <>
                <h2 className="text-3xl font-serif font-bold text-portal-text-primary mb-4">
                  Two-Factor <span className="text-portal-gold">Authentication</span>
                </h2>
                <p className="text-portal-text-muted text-lg">Enter the 6-digit code from your authenticator app to verify your identity.</p>
              </>
            )}
            {step === "setup-2fa" && (
              <>
                <h2 className="text-3xl font-serif font-bold text-portal-text-primary mb-4">
                  Secure Your <span className="text-portal-gold">Account</span>
                </h2>
                <p className="text-portal-text-muted text-lg">Two-factor authentication is mandatory for all corporate accounts. Set it up now to continue.</p>
              </>
            )}
          </div>
        </div>

        {/* Right — form */}
        <div className="form-section flex items-center justify-center p-6 lg:p-8 min-h-[calc(100vh-120px)] lg:min-h-screen bg-portal-bg">
          <div className="w-full max-w-md">
            <div className="form-card bg-portal-card rounded-3xl shadow-2xl shadow-black/20 p-8 border border-portal-border">

              {/* ── STEP: LOGIN ── */}
              {step === "login" && (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-portal-gold mb-2">Sign In</h2>
                    <p className="text-portal-text-muted">Sign in to access your corporate portal</p>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400 font-medium">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-portal-gold mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-portal-text-muted" />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 bg-portal-input border border-portal-border rounded-xl focus:ring-2 focus:ring-portal-gold-soft focus:border-portal-gold-border outline-none transition-all text-portal-text-primary placeholder:text-portal-text-muted"
                          placeholder="you@company.com.au" autoFocus required />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between mb-2">
                        <label className="block text-sm font-semibold text-portal-gold">Password</label>
                        <button type="button" onClick={() => { setResetEmail(email); setResetFlow("email"); setError(""); }}
                          className="text-xs text-portal-text-muted hover:text-portal-gold transition-colors">Forgot password?</button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-portal-text-muted" />
                        <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-3.5 bg-portal-input border border-portal-border rounded-xl focus:ring-2 focus:ring-portal-gold-soft focus:border-portal-gold-border outline-none transition-all text-portal-text-primary placeholder:text-portal-text-muted"
                          placeholder="••••••••" required />
                        <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-portal-text-muted">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {password && (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {[1,2,3,4,5].map(i => (
                              <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                                style={{ background: i <= strength.score ? strength.color : "rgba(255,255,255,0.08)" }} />
                            ))}
                          </div>
                          <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
                        </div>
                      )}
                    </div>

                    <button type="submit" disabled={loading}
                      className="w-full bg-portal-gold hover:bg-portal-gold/90 text-[#0b0b0f] font-semibold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg shadow-portal-gold/20 hover:shadow-xl hover:shadow-portal-gold/20 mt-6">
                      {loading ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Signing in...</span></>
                      ) : (
                        <><Lock className="w-5 h-5" /><span>Sign In</span></>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-xs text-portal-text-muted">
                      <Shield className="w-3.5 h-3.5" /><span>Protected by enterprise-grade security</span>
                    </div>

                    <div className="flex items-baseline justify-between pt-6 text-sm border-t border-portal-border">
                      <a href="/register" className="text-portal-gold font-semibold transition-colors">Create account</a>
                    </div>
                  </form>
                </>
              )}

              {/* ── STEP: VERIFY 2FA ── */}
              {step === "2fa" && (
                <>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-portal-gold rounded-2xl shadow-lg shadow-portal-gold/20 mb-4">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-portal-gold mb-2">Two-Factor Authentication</h2>
                    <p className="text-portal-text-muted">Enter the 6-digit code from your authenticator app</p>
                  </div>

                  {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl">
                      <p className="text-sm text-red-400 font-medium">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleVerify2FA} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-portal-gold mb-2">Authentication Code</label>
                      <input ref={twoFARef} type="text" value={twoFACode}
                        onChange={e => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full px-4 py-4 bg-portal-input border border-portal-border rounded-xl focus:ring-2 focus:ring-portal-gold-soft focus:border-portal-gold-border outline-none transition-all text-center text-3xl font-mono tracking-[0.5em] text-portal-text-primary"
                        placeholder="000000" maxLength={6} autoComplete="one-time-code" required />
                    </div>

                    <button type="submit" disabled={loading}
                      className="w-full bg-portal-gold hover:bg-portal-gold/90 text-[#0b0b0f] font-semibold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 shadow-lg shadow-portal-gold/20 mt-6">
                      {loading ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Verifying...</span></>
                      ) : (
                        <><Shield className="w-5 h-5" /><span>Verify & Sign In</span></>
                      )}
                    </button>

                    <button type="button" onClick={() => { setStep("login"); setTwoFACode(""); setError(""); }}
                      className="w-full bg-portal-input text-portal-gold font-semibold py-3 rounded-xl transition-all">
                      Back to Login
                    </button>
                  </form>
                </>
              )}

              {/* ── STEP: SETUP 2FA ── */}
              {step === "setup-2fa" && (
                <>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-portal-gold rounded-2xl shadow-lg shadow-portal-gold/20 mb-4">
                      <Smartphone className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-portal-gold mb-2">Set Up Two-Factor Authentication</h2>
                    <p className="text-portal-text-muted">2FA is mandatory. Scan the QR code or enter the key manually.</p>
                  </div>

                  {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl">
                      <p className="text-sm text-red-400 font-medium">{error}</p>
                    </div>
                  )}

                  <div className="bg-portal-input rounded-2xl p-5 border border-portal-border mb-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 bg-portal-gold rounded-xl flex items-center justify-center flex-shrink-0 shadow-portal-gold/20 shadow-lg">
                        <Smartphone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-portal-gold mb-1">Add to Authenticator App</h3>
                        <p className="text-sm text-portal-text-muted">Google Authenticator, Authy, or Microsoft Authenticator</p>
                      </div>
                    </div>

                    <div className="bg-portal-card rounded-xl p-4 mb-4 border border-portal-border">
                      <p className="text-xs font-semibold text-portal-text-muted mb-2 uppercase tracking-wide">Secret Key:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm font-mono bg-portal-input px-3 py-2.5 rounded-xl text-portal-gold break-all border border-portal-border select-all">
                          {twoFASecret}
                        </code>
                        <button type="button" onClick={copySecret}
                          className="p-2.5 bg-portal-gold hover:bg-portal-gold/90 rounded-xl transition-all flex-shrink-0 shadow-lg shadow-portal-gold/20">
                          {copied ? <Check className="w-4 h-4 text-[#0b0b0f]" /> : <Copy className="w-4 h-4 text-[#0b0b0f]" />}
                        </button>
                      </div>
                      {copied && <p className="text-xs text-green-400 font-semibold mt-2 flex items-center gap-1"><Check className="w-3 h-3" /> Copied!</p>}
                    </div>

                    {qrCodeUrl && (
                      <div className="text-center">
                        <p className="text-xs text-portal-text-muted mb-3">Or scan QR code:</p>
                        <img src={qrCodeUrl} alt="2FA QR Code" className="mx-auto rounded-xl border border-portal-border shadow-lg" style={{width:180,height:180}} />
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSetup2FA} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-portal-gold mb-2">Enter 6-digit code to confirm setup</label>
                      <input ref={setupRef} type="text" value={setupCode}
                        onChange={e => setSetupCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full px-4 py-4 bg-portal-input border border-portal-border rounded-xl focus:ring-2 focus:ring-portal-gold-soft focus:border-portal-gold-border outline-none transition-all text-center text-3xl font-mono tracking-[0.5em] text-portal-text-primary"
                        placeholder="000000" maxLength={6} autoComplete="one-time-code" required />
                    </div>

                    <button type="submit" disabled={loading}
                      className="w-full bg-portal-gold hover:bg-portal-gold/90 text-[#0b0b0f] font-semibold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 shadow-lg shadow-portal-gold/20">
                      {loading ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Verifying...</span></>
                      ) : (
                        <><Lock className="w-5 h-5" /><span>Verify & Sign In</span></>
                      )}
                    </button>

                    <button type="button" onClick={() => { setStep("login"); setSetupCode(""); setError(""); }}
                      className="w-full bg-portal-input text-portal-gold font-semibold py-3 rounded-xl transition-all">
                      Cancel
                    </button>
                  </form>
                </>
              )}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-portal-text-muted">Need assistance? <a href="mailto:support@ausclear.com.au" className="text-portal-gold font-semibold">Contact Support</a></p>
              <p className="text-xs text-portal-text-muted mt-3">Nephthys Pty Ltd (ACN 628 031 587) trading as AusClear</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-portal-bg to-transparent pointer-events-none" />
    </div>
  );
}

