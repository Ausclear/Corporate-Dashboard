"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const em = email.toLowerCase().trim();
    if (!em || !em.includes("@")) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    try {
      const { error: e } = await supabase.auth.resetPasswordForEmail(em, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (e) { setError(e.message); } else { setSent(true); }
    } catch { setError("An error occurred. Please try again."); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-portal-bg relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-portal-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="lg:hidden pt-8 pb-4 px-6 text-center">
        <img src="https://ausclear.au/AusClear-Dark-Transparent.png" alt="AusClear" className="h-16 w-auto mx-auto mb-2" />
      </div>
      <div className="split-layout flex flex-col lg:flex-row relative z-10">
        <div className="marketing-section hidden lg:flex flex-col justify-center px-12 py-12 bg-portal-card border-r border-portal-border relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-portal-gold via-portal-gold to-transparent" />
          <div className="max-w-xl relative z-10">
            <img src="https://ausclear.au/AusClear-Dark-Transparent.png" alt="AusClear" className="h-20 w-auto mb-6" />
            <h2 className="text-3xl font-serif font-bold text-portal-text-primary mb-4">Reset Your <span className="text-portal-gold">Password</span></h2>
            <p className="text-portal-text-muted text-lg">Enter your email and we will send you a secure reset link.</p>
          </div>
        </div>
        <div className="form-section flex items-center justify-center p-6 lg:p-8 lg:min-h-screen bg-portal-bg">
          <div className="w-full max-w-md">
            <div className="form-card bg-portal-card rounded-3xl shadow-2xl shadow-black/20 p-8 border border-portal-border">
              {!sent ? (
                <>
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-portal-gold rounded-2xl shadow-lg shadow-portal-gold/20 mb-4">
                      <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-portal-gold mb-2">Reset Password</h2>
                    <p className="text-portal-text-muted">Enter your email and we&apos;ll send a reset link</p>
                  </div>
                  {error && <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl"><p className="text-sm text-red-400 font-medium">{error}</p></div>}
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
                    <button type="submit" disabled={loading}
                      className="w-full bg-portal-gold hover:bg-portal-gold/90 text-[#0b0b0f] font-semibold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-portal-gold/20">
                      {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Sending...</span></> : "Send Reset Link"}
                    </button>
                    <div className="text-center pt-4 border-t border-portal-border">
                      <a href="/login" className="text-sm text-portal-gold font-semibold">← Back to sign in</a>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-portal-gold rounded-2xl shadow-lg shadow-portal-gold/20 mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-portal-gold mb-2">Check Your Inbox</h2>
                  <p className="text-portal-text-muted mb-2">If <span className="text-portal-gold font-semibold">{email}</span> is registered, you will receive a reset link shortly.</p>
                  <div className="mt-6 pt-4 border-t border-portal-border">
                    <a href="/login" className="text-sm text-portal-gold font-semibold">← Back to sign in</a>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 text-center">
              <p className="text-xs text-portal-text-muted">Nephthys Pty Ltd (ACN 628 031 587) trading as AusClear</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
