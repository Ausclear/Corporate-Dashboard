"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Smartphone, Shield, Copy, Check } from "lucide-react";

function Setup2FAContent() {
  const [qrUrl, setQrUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState(["","","","","",""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [copied, setCopied] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  useEffect(() => {
    if (!email) { router.push("/login"); return; }
    (async () => {
      try {
        const res = await fetch("/api/auth/setup-2fa", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (data.qr) { setQrUrl(data.qr); setSecret(data.secret); }
        else setError(data.error || "Failed to generate 2FA setup.");
      } catch { setError("Failed to load 2FA setup."); }
      setFetching(false);
    })();
  }, [email, router]);

  useEffect(() => {
    if (!fetching) setTimeout(() => refs.current[0]?.focus(), 100);
  }, [fetching]);

  const handleInput = (i: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code]; next[i] = value.slice(-1); setCode(next);
    if (value && i < 5) refs.current[i + 1]?.focus();
    if (next.every(d => d) && next.join("").length === 6) verify(next.join(""));
  };
  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (p.length === 6) { setCode(p.split("")); refs.current[5]?.focus(); verify(p); }
  };
  const verify = async (c: string) => {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: c }),
      });
      const data = await res.json();
      if (!data.valid) {
        setError(data.error || "Invalid code. Please try again.");
        setCode(["","","","","",""]); refs.current[0]?.focus();
      } else { router.push("/dashboard"); }
    } catch { setError("Verification failed."); }
    setLoading(false);
  };
  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (fetching) return (
    <div className="text-center py-10">
      <div className="w-10 h-10 border-2 border-portal-border border-t-portal-gold rounded-full animate-spin mx-auto mb-4" />
      <p className="text-portal-text-muted text-sm">Generating your 2FA setup...</p>
    </div>
  );

  return (
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
          <div className="w-10 h-10 bg-portal-gold rounded-xl flex items-center justify-center flex-shrink-0 shadow-portal-gold/20 shadow-lg">
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
            <code className="flex-1 text-sm font-mono bg-portal-input px-4 py-3 rounded-xl text-portal-gold break-all border border-portal-border select-all">
              {secret}
            </code>
            <button type="button" onClick={copySecret}
              className="p-3 bg-portal-gold hover:bg-portal-gold/90 rounded-xl transition-all flex-shrink-0 shadow-lg shadow-portal-gold/20">
              {copied ? <Check className="w-5 h-5 text-[#0b0b0f]" /> : <Copy className="w-5 h-5 text-[#0b0b0f]" />}
            </button>
          </div>
          {copied && <p className="text-xs text-green-400 font-semibold flex items-center gap-1"><Check className="w-3 h-3" /> Copied! Paste into your authenticator app</p>}
        </div>

        <ol className="text-sm text-portal-text-muted space-y-1 pl-5 list-decimal">
          <li>Open your authenticator app and tap "+"</li>
          <li>Choose "Enter a setup key" or "Manual entry"</li>
          <li>Paste the code above, then enter the 6-digit code below</li>
        </ol>
      </div>

      {qrUrl && (
        <div className="hidden lg:block bg-portal-input rounded-2xl p-6 border border-portal-border text-center">
          <p className="text-sm font-semibold text-portal-gold mb-4">Or scan this QR code:</p>
          <img src={qrUrl} alt="2FA QR Code" className="mx-auto rounded-xl border border-portal-border shadow-lg" style={{width:200,height:200}} />
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-portal-gold mb-2">Enter the 6-digit code from your app</label>
        <div className="flex gap-2 justify-center mb-4">
          {code.map((d, i) => (
            <input key={i} ref={el => { refs.current[i] = el; }}
              type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-2xl font-bold bg-portal-input border border-portal-border rounded-xl text-portal-text-primary outline-none focus:border-portal-gold-border focus:ring-2 focus:ring-portal-gold-soft font-serif"
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl">
          <p className="text-sm text-red-400 font-medium">{error}</p>
        </div>
      )}

      <button onClick={() => verify(code.join(""))} disabled={loading || code.join("").length !== 6}
        className="w-full bg-portal-gold hover:bg-portal-gold/90 text-[#0b0b0f] font-semibold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg shadow-portal-gold/20">
        {loading ? (
          <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Verifying...</span></>
        ) : (
          <><Lock className="w-5 h-5" /><span>Verify & Sign In</span></>
        )}
      </button>
    </div>
  );
}

export default function Setup2FAPage() {
  return (
    <div className="min-h-screen bg-portal-bg relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-portal-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="lg:hidden pt-8 pb-4 px-6 text-center">
        <img src="https://ausclear.au/AusClear-Dark-Transparent.png" alt="AusClear" className="h-16 w-auto mx-auto mb-2" />
        <p className="text-portal-gold text-sm font-semibold tracking-wide font-serif">Corporate Portal</p>
      </div>
      <div className="split-layout flex flex-col lg:flex-row relative z-10">
        <div className="marketing-section hidden lg:flex flex-col justify-center px-12 py-12 bg-portal-card border-r border-portal-border relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-portal-gold via-portal-gold to-transparent" />
          <div className="max-w-xl relative z-10">
            <img src="https://ausclear.au/AusClear-Dark-Transparent.png" alt="AusClear" className="h-20 w-auto mb-6" />
            <h2 className="text-3xl font-serif font-bold text-portal-text-primary mb-4">Secure Your <span className="text-portal-gold">Account</span></h2>
            <p className="text-portal-text-muted text-lg">Two-factor authentication adds an essential layer of security to protect your sensitive clearance data.</p>
          </div>
        </div>
        <div className="form-section flex items-center justify-center p-6 lg:p-8 lg:min-h-screen bg-portal-bg">
          <div className="w-full max-w-lg">
            <div className="form-card bg-portal-card rounded-3xl shadow-2xl shadow-black/20 p-8 border border-portal-border">
              <Suspense fallback={<div className="text-portal-text-muted text-center py-8">Loading...</div>}>
                <Setup2FAContent />
              </Suspense>
            </div>
            <div className="mt-6 text-center">
              <p className="text-xs text-portal-text-muted">Nephthys Pty Ltd (ACN 628 031 587) trading as AusClear</p>
            </div>
          </div>
        </div>
      </div>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-portal-bg to-transparent pointer-events-none" />
    </div>
  );
}
