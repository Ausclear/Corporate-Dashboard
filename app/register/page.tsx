"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, Shield, CheckCircle, AlertCircle, Smartphone, Copy, Check } from "lucide-react";

type Step = "register" | "setup-2fa" | "email-confirmation";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [twoFASecret, setTwoFASecret] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [copied, setCopied] = useState(false);

  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const setupRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (step === "setup-2fa") setTimeout(() => setupRef.current?.focus(), 100);
    if (step === "email-confirmation") setTimeout(() => otpRef.current?.focus(), 100);
  }, [step]);

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const em = email.toLowerCase().trim();
    if (!em || !password || !confirmPw) { setError("All fields are required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPw) { setError("Passwords do not match."); return; }
    if (strength.score < 2) { setError("Please choose a stronger password."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.redirect_to_login) {
          // Account exists — redirect to login with message
          router.push("/login?notice=" + encodeURIComponent(data.error));
          return;
        }
        setError(data.error || "Registration failed."); setLoading(false); return;
      }

      // Load 2FA setup
      const tfaRes = await fetch("/api/auth/setup-2fa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
      });
      const tfaData = await tfaRes.json();
      if (tfaData.qr) { setQrCodeUrl(tfaData.qr); setTwoFASecret(tfaData.secret); }
      else { setError(tfaData.error || "Failed to generate 2FA setup."); setLoading(false); return; }

      setStep("setup-2fa");
    } catch { setError("An error occurred. Please try again."); }
    setLoading(false);
  };

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
        setSetupCode(""); setupRef.current?.focus();
      } else {
        // 2FA set up — now trigger email confirmation OTP
        await supabase.auth.resend({ type: "signup", email: email.toLowerCase().trim() });
        setStep("email-confirmation");
      }
    } catch { setError("Verification failed. Please try again."); }
    setLoading(false);
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setResendSuccess("");
    if (emailOtpCode.length < 6) { setError("Please enter the full verification code."); return; }
    setLoading(true);
    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: emailOtpCode,
        type: "email",
      });
      if (verifyErr) { setError(verifyErr.message); setLoading(false); return; }
      router.push("/dashboard");
      router.refresh();
    } catch { setError("Verification failed. Please try again."); }
    setLoading(false);
  };

  const handleResend = async () => {
    setResendLoading(true); setError(""); setResendSuccess("");
    try {
      await supabase.auth.resend({ type: "signup", email: email.toLowerCase().trim() });
      setResendSuccess("Verification email resent. Please check your inbox.");
      setTimeout(() => setResendSuccess(""), 5000);
    } catch { setError("Failed to resend. Please try again."); }
    setResendLoading(false);
  };

  const copySecret = () => {
    navigator.clipboard.writeText(twoFASecret);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const leftPanel = {
    register: { title: <>Create Your <span className="text-portal-gold">Secure Account</span></>, sub: "Your email must be registered with AusClear before you can create a corporate account." },
    "setup-2fa": { title: <>Secure Your <span className="text-portal-gold">Account</span></>, sub: "Two-factor authentication is mandatory for all corporate accounts." },
    "email-confirmation": { title: <>Almost <span className="text-portal-gold">There!</span></>, sub: "Check your email for a verification code to activate your account." },
  };

  return (
    <div className="min-h-screen bg-portal-bg relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-portal-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-portal-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="lg:hidden pt-8 pb-4 px-6 text-center">
        <img src="https://ausclear.au/AusClear-Dark-Transparent.png" alt="AusClear" className="h-16 w-auto mx-auto mb-2" />
        <p className="text-portal-gold text-sm font-semibold tracking-wide font-serif">Corporate Portal</p>
      </div>

      <div className="split-layout flex flex-col lg:flex-row relative z-10">
        <div className="marketing-section hidden lg:flex flex-col justify-center px-12 py-12 bg-portal-card border-r border-portal-border relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-portal-gold via-portal-gold to-transparent" />
          <div className="max-w-xl relative z-10">
            <img src="https://ausclear.au/AusClear-Dark-Transparent.png" alt="AusClear" className="h-20 w-auto mb-8" />
            <h2 className="text-3xl font-serif font-bold text-portal-text-primary mb-4">{leftPanel[step].title}</h2>
            <p className="text-portal-text-muted text-lg mb-8">{leftPanel[step].sub}</p>
            {step === "register" && (
              <div className="bg-portal-input border border-portal-border rounded-xl p-5">
                <p className="text-sm font-bold text-portal-gold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> Security Requirements</p>
                <ul className="space-y-2 text-sm text-portal-text-muted">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-portal-gold flex-shrink-0" />Registered AusClear corporate email</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-portal-gold flex-shrink-0" />Strong password (8+ characters)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-portal-gold flex-shrink-0" />Mandatory two-factor authentication</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-portal-gold flex-shrink-0" />Email verification to activate account</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="form-section flex items-center justify-center p-6 lg:p-8 min-h-[calc(100vh-120px)] lg:min-h-screen bg-portal-bg">
          <div className="w-full max-w-lg">
            <div className="form-card bg-portal-card rounded-3xl shadow-2xl shadow-black/20 p-8 border border-portal-border">

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400 font-medium">{error}</p>
                </div>
              )}

              {/* ── REGISTER ── */}
              {step === "register" && (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-portal-gold mb-2">Create Account</h2>
                    <p className="text-sm text-portal-text-muted">Get started with your secure corporate portal</p>
                  </div>

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
                    <label className="block text-sm font-semibold text-portal-gold mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-portal-text-muted" />
                      <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-3.5 bg-portal-input border border-portal-border rounded-xl focus:ring-2 focus:ring-portal-gold-soft focus:border-portal-gold-border outline-none transition-all text-portal-text-primary placeholder:text-portal-text-muted"
                        placeholder="Minimum 8 characters" required />
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

                  <div>
                    <label className="block text-sm font-semibold text-portal-gold mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-portal-text-muted" />
                      <input type={showPassword ? "text" : "password"} value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-portal-input border border-portal-border rounded-xl focus:ring-2 focus:ring-portal-gold-soft focus:border-portal-gold-border outline-none transition-all text-portal-text-primary placeholder:text-portal-text-muted"
                        placeholder="Re-enter password" required />
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full bg-portal-gold hover:bg-portal-gold/90 text-[#0b0b0f] font-semibold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg shadow-portal-gold/20 mt-2">
                    {loading ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Creating account...</span></>
                    ) : <span>Continue to 2FA Setup</span>}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-portal-text-muted">
                    <Shield className="w-3.5 h-3.5" /><span>Protected by enterprise-grade security</span>
                  </div>

                  <div className="text-center pt-4 border-t border-portal-border">
                    <p className="text-sm text-portal-text-muted">Already have an account? <a href="/login" className="text-portal-gold font-semibold">Sign in</a></p>
                  </div>
                </form>
              )}

              {/* ── SETUP 2FA ── */}
              {step === "setup-2fa" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-portal-gold rounded-2xl shadow-lg shadow-portal-gold/20 mb-4">
                      <Smartphone className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-portal-gold mb-2">Two-Factor Authentication</h2>
                    <p className="text-portal-text-muted">For your security, 2FA is mandatory for all accounts</p>
                  </div>

                  <div className="bg-portal-input rounded-2xl p-6 border border-portal-border">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 bg-portal-gold rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-portal-gold/20">
                        <Smartphone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-portal-gold mb-1">Setup on Mobile</h3>
                        <p className="text-sm text-portal-text-muted">Open Google Authenticator, Authy, or Microsoft Authenticator and add via manual entry</p>
                      </div>
                    </div>
                    <div className="bg-portal-card rounded-xl p-4 mb-4 border border-portal-border">
                      <p className="text-xs font-semibold text-portal-text-muted mb-2 uppercase tracking-wide">Your Secret Code:</p>
                      <div className="flex items-center gap-2 mb-2">
                        <code className="flex-1 text-sm font-mono bg-portal-input px-3 py-2.5 rounded-xl text-portal-gold break-all border border-portal-border select-all">{twoFASecret}</code>
                        <button type="button" onClick={copySecret} className="p-2.5 bg-portal-gold hover:bg-portal-gold/90 rounded-xl transition-all flex-shrink-0 shadow-lg shadow-portal-gold/20">
                          {copied ? <Check className="w-4 h-4 text-[#0b0b0f]" /> : <Copy className="w-4 h-4 text-[#0b0b0f]" />}
                        </button>
                      </div>
                      {copied && <p className="text-xs text-green-400 font-semibold flex items-center gap-1"><Check className="w-3 h-3" /> Copied!</p>}
                    </div>
                    <ol className="text-sm text-portal-text-muted space-y-1 pl-5 list-decimal">
                      <li>Open your authenticator app and tap "+"</li>
                      <li>Choose "Enter a setup key" or "Manual entry"</li>
                      <li>Paste the code above, then enter the 6-digit code below</li>
                    </ol>
                  </div>

                  {qrCodeUrl && (
                    <div className="hidden lg:block bg-portal-input rounded-2xl p-6 border border-portal-border text-center">
                      <p className="text-sm font-semibold text-portal-gold mb-4">Or scan this QR code:</p>
                      <img src={qrCodeUrl} alt="2FA QR Code" className="mx-auto rounded-xl border border-portal-border shadow-lg" style={{width:180,height:180}} />
                    </div>
                  )}

                  <form onSubmit={handleSetup2FA} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-portal-gold mb-2">Enter the 6-digit code from your app</label>
                      <input ref={setupRef} type="text" value={setupCode}
                        onChange={e => setSetupCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full px-4 py-4 bg-portal-input border border-portal-border rounded-xl focus:ring-2 focus:ring-portal-gold-soft focus:border-portal-gold-border outline-none transition-all text-center text-3xl font-mono tracking-[0.5em] text-portal-text-primary"
                        placeholder="000000" maxLength={6} autoComplete="one-time-code" required />
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full bg-portal-gold hover:bg-portal-gold/90 text-[#0b0b0f] font-semibold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 shadow-lg shadow-portal-gold/20">
                      {loading ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Verifying...</span></>
                      ) : <><Lock className="w-5 h-5" /><span>Verify & Continue</span></>}
                    </button>
                    <button type="button" onClick={() => router.push("/login")}
                      className="w-full bg-portal-input text-portal-gold font-semibold py-3 rounded-xl transition-all">Cancel Registration</button>
                  </form>
                </div>
              )}

              {/* ── EMAIL OTP ── */}
              {step === "email-confirmation" && (
                <div className="space-y-6 text-center">
                  <div>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-portal-gold rounded-2xl shadow-lg shadow-portal-gold/20 mb-4">
                      <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-portal-gold mb-3">Check Your Email</h2>
                    <p className="text-portal-text-muted mb-1">We&apos;ve sent a verification code to:</p>
                    <p className="text-lg font-semibold text-portal-gold">{email}</p>
                  </div>

                  <div className="bg-green-500/10 border-l-4 border-green-500 p-4 rounded-r-xl text-left">
                    <p className="text-sm text-green-300 font-semibold mb-1">✓ Account Created &amp; 2FA Enabled</p>
                    <p className="text-sm text-green-400">Enter the code from your email below to activate your account and sign in.</p>
                  </div>

                  {resendSuccess && (
                    <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-r-xl text-left">
                      <p className="text-sm text-portal-text-muted font-medium">✓ {resendSuccess}</p>
                    </div>
                  )}

                  <form onSubmit={handleVerifyEmailOtp} className="space-y-5 text-left">
                    <div>
                      <label className="block text-sm font-semibold text-portal-gold mb-2">Verification Code</label>
                      <input ref={otpRef} type="text" value={emailOtpCode}
                        onChange={e => setEmailOtpCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                        className="w-full px-4 py-4 bg-portal-input border border-portal-border rounded-xl focus:ring-2 focus:ring-portal-gold-soft focus:border-portal-gold-border outline-none transition-all text-center text-3xl font-mono tracking-[0.4em] text-portal-text-primary"
                        placeholder="00000000" maxLength={8} autoComplete="one-time-code" required />
                    </div>
                    <button type="submit" disabled={loading || emailOtpCode.length < 6}
                      className="w-full bg-portal-gold hover:bg-portal-gold/90 text-[#0b0b0f] font-semibold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg shadow-portal-gold/20">
                      {loading ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Verifying...</span></>
                      ) : <span>Verify &amp; Sign In</span>}
                    </button>
                  </form>

                  <div className="pt-4 border-t border-portal-border">
                    <button type="button" onClick={handleResend} disabled={resendLoading}
                      className="w-full bg-portal-input text-portal-gold font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {resendLoading ? (
                        <><div className="w-4 h-4 border-2 border-portal-gold-border border-t-transparent rounded-full animate-spin" /><span>Sending...</span></>
                      ) : <><Mail className="w-4 h-4" /><span>Resend Verification Email</span></>}
                    </button>
                    <p className="text-xs text-portal-text-muted mt-3">Didn&apos;t receive the email? Check your spam folder or try resending.</p>
                  </div>
                </div>
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
