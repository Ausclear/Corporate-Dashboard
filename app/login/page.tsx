"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, Shield, CheckCircle, FileText, MessageSquare, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("All fields are required."); return; }
    setLoading(true);
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: email.toLowerCase().trim(), password });
      if (authErr) {
        if (authErr.message.toLowerCase().includes("invalid")) {
          setError("Incorrect email or password. Please try again.");
        } else {
          setError(authErr.message);
        }
        setLoading(false); return;
      }
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
    } catch { setError("An error occurred. Please try again."); }
    setLoading(false);
  };

  const features = [
    { icon: CheckCircle, title: "Track Clearance Status", desc: "Real-time updates on application progress" },
    { icon: FileText, title: "Manage Documents", desc: "Upload and access documents securely" },
    { icon: MessageSquare, title: "Secure Messaging", desc: "Communicate with your AusClear consultant" },
    { icon: Shield, title: "Securely Encrypted", desc: "End-to-end encryption on Australian servers" },
  ];

  return (
    <div className="min-h-screen bg-portal-bg relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-portal-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-portal-gold/5 rounded-full blur-3xl pointer-events-none" />

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
            <div className="mb-6">
              <img src="https://ausclear.au/AusClear-Dark-Transparent.png" alt="AusClear" className="h-20 w-auto mb-6" />
            </div>
            <div className="mb-8">
              <h2 className="text-3xl font-serif font-bold text-portal-text-primary mb-4">
                Manage Your Security<br /><span className="text-portal-gold">Clearance Programme</span>
              </h2>
              <p className="text-portal-text-muted text-lg">
                The AusClear corporate dashboard gives your security team complete visibility over sponsored clearances, applications, and compliance obligations.
              </p>
            </div>
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
          </div>
        </div>

        {/* Right — form */}
        <div className="form-section flex items-center justify-center p-6 lg:p-8 min-h-[calc(100vh-120px)] lg:min-h-screen bg-portal-bg">
          <div className="w-full max-w-md">
            <div className="form-card bg-portal-card rounded-3xl shadow-2xl shadow-black/20 p-8 border border-portal-border">
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
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-portal-input border border-portal-border rounded-xl focus:ring-2 focus:ring-portal-gold-soft focus:border-portal-gold-border outline-none transition-all text-portal-text-primary placeholder:text-portal-text-muted"
                      placeholder="you@company.com.au" autoFocus required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="block text-sm font-semibold text-portal-gold">Password</label>
                    <a href="/forgot-password" className="text-xs text-portal-text-muted hover:text-portal-gold transition-colors">Forgot password?</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-portal-text-muted" />
                    <input
                      type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 bg-portal-input border border-portal-border rounded-xl focus:ring-2 focus:ring-portal-gold-soft focus:border-portal-gold-border outline-none transition-all text-portal-text-primary placeholder:text-portal-text-muted"
                      placeholder="••••••••" required
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-portal-text-muted">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-portal-gold hover:bg-portal-gold/90 text-[#0b0b0f] font-semibold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg shadow-portal-gold/20 hover:shadow-xl hover:shadow-portal-gold/20 mt-6">
                  {loading ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Signing in...</span></>
                  ) : (
                    <><Lock className="w-5 h-5" /><span>Sign In</span></>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-portal-text-muted">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Protected by enterprise-grade security</span>
                </div>

                <div className="flex items-baseline justify-between pt-6 text-sm border-t border-portal-border mt-4">
                  <a href="/register" className="text-portal-gold hover:text-portal-gold font-semibold transition-colors">Create account</a>
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
