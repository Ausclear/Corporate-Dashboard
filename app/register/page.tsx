"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, Shield, CheckCircle, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const em = email.toLowerCase().trim();
    if (!em || !password || !confirmPw) { setError("All fields are required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPw) { setError("Passwords do not match."); return; }
    if (strength.score < 2) { setError("Please choose a stronger password."); return; }
    setLoading(true);
    try {
      const checkRes = await fetch("/api/auth/check-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
      });
      const checkData = await checkRes.json();
      if (!checkData.authorised) {
        setError("This email is not associated with a corporate AusClear account. Please contact us on 1300 027 423.");
        setLoading(false); return;
      }
      const { error: authErr } = await supabase.auth.signUp({ email: em, password,
        options: { data: { company_name: checkData.company_name } } });
      if (authErr) {
        if (authErr.message.includes("already registered")) {
          setError("An account with this email already exists. Please sign in instead.");
        } else { setError(authErr.message); }
        setLoading(false); return;
      }
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email: em, password });
      if (loginErr) {
        setError("Account created. Please check your email to confirm, then sign in.");
        setLoading(false); return;
      }
      router.push("/setup-2fa?email=" + encodeURIComponent(em));
    } catch { setError("An error occurred. Please try again."); }
    setLoading(false);
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
        {/* Left — marketing */}
        <div className="marketing-section hidden lg:flex flex-col justify-center px-12 py-12 bg-portal-card border-r border-portal-border relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-portal-gold via-portal-gold to-transparent" />
          <div className="max-w-xl relative z-10">
            <img src="https://ausclear.au/AusClear-Dark-Transparent.png" alt="AusClear" className="h-20 w-auto mb-6" />
            <h2 className="text-3xl font-serif font-bold text-portal-text-primary mb-4">
              Create Your <span className="text-portal-gold">Secure Account</span>
            </h2>
            <p className="text-portal-text-muted text-lg mb-8">Your email must be registered with AusClear before you can create a corporate account.</p>
            <div className="bg-portal-input border border-portal-border rounded-xl p-5">
              <p className="text-sm font-bold text-portal-gold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> Security Requirements</p>
              <ul className="space-y-2 text-sm text-portal-text-muted">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-portal-gold flex-shrink-0" />Registered AusClear corporate email</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-portal-gold flex-shrink-0" />Strong password (8+ characters)</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-portal-gold flex-shrink-0" />Mandatory two-factor authentication</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-portal-gold flex-shrink-0" />End-to-end encrypted access</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="form-section flex items-center justify-center p-6 lg:p-8 min-h-[calc(100vh-120px)] lg:min-h-screen bg-portal-bg">
          <div className="w-full max-w-md">
            <div className="form-card bg-portal-card rounded-3xl shadow-2xl shadow-black/20 p-8 border border-portal-border">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-portal-gold mb-2">Create Account</h2>
                <p className="text-portal-text-muted">Your email must be registered with AusClear</p>
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
                          <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{ background: i <= strength.score ? strength.color : "rgba(255,255,255,0.08)" }} />
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

                <div className="bg-portal-input border border-portal-gold-border rounded-xl p-4">
                  <p className="text-xs text-portal-text-muted leading-relaxed">
                    🔐 <strong className="text-portal-text-primary">Two-factor authentication is mandatory</strong> for all corporate accounts. You will be guided through setup after registration.
                  </p>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-portal-gold hover:bg-portal-gold/90 text-[#0b0b0f] font-semibold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg shadow-portal-gold/20 hover:shadow-xl hover:shadow-portal-gold/20 mt-2">
                  {loading ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Creating account...</span></>
                  ) : (
                    <span>Continue to 2FA Setup</span>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-xs text-portal-text-muted">
                  <Shield className="w-3.5 h-3.5" /><span>Protected by enterprise-grade security</span>
                </div>

                <div className="text-center pt-4 border-t border-portal-border">
                  <p className="text-sm text-portal-text-muted">Already have an account? <a href="/login" className="text-portal-gold font-semibold">Sign in</a></p>
                </div>
              </form>
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
