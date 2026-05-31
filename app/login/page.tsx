"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const acct = accountNumber.toUpperCase().trim();
    if (!acct) { setError("Please enter your account number."); return; }
    setLoading(true);

    try {
      const res = await fetch(`/api/dashboard/data?account_number=${encodeURIComponent(acct)}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        sessionStorage.setItem("account_number", acct);
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-portal-bg relative overflow-hidden flex items-center justify-center p-6">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-portal-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-portal-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <img src="https://ausclear.au/AusClear-Dark-Transparent.png" alt="AusClear" className="h-20 w-auto mx-auto mb-4" />
          <p className="text-portal-gold text-sm font-semibold tracking-wide">Corporate Dashboard</p>
        </div>

        <div className="bg-portal-card rounded-3xl shadow-2xl shadow-black/20 p-8 border border-portal-border">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-portal-gold rounded-2xl shadow-lg shadow-portal-gold/20 mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-portal-gold mb-2">Sign In</h2>
            <p className="text-sm text-portal-text-muted">Enter your AusClear account number to access your dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-portal-gold mb-2">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value.toUpperCase())}
                className="w-full px-5 py-4 bg-portal-input border border-portal-border rounded-xl focus:ring-2 focus:ring-portal-gold-soft focus:border-portal-gold-border outline-none transition-all text-portal-text-primary placeholder:text-portal-text-muted text-center text-2xl font-mono tracking-[0.3em]"
                placeholder="TE19166"
                autoFocus
                required
              />
              <p className="text-xs text-portal-text-muted mt-2 text-center">Your account reference from AusClear</p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-portal-gold hover:bg-portal-gold/90 text-[#0b0b0f] font-semibold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg shadow-portal-gold/20 hover:shadow-xl hover:shadow-portal-gold/20">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-[#0b0b0f] border-t-transparent rounded-full animate-spin" /><span>Loading...</span></>
              ) : (
                <><span>Access Dashboard</span><ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-portal-text-muted">
              Need assistance? <a href="mailto:support@ausclear.com.au" className="text-portal-gold font-semibold">support@ausclear.com.au</a>
            </p>
            <p className="text-xs text-portal-text-muted mt-1">
              or call <a href="tel:1300027423" className="text-portal-gold font-semibold">1300 027 423</a>
            </p>
          </div>
        </div>

        <p className="text-xs text-portal-text-muted text-center mt-6">Nephthys Pty Ltd (ACN 628 031 587) trading as AusClear</p>
      </div>
    </div>
  );
}
