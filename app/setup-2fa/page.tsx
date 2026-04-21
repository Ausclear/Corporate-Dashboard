"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

function Setup2FAContent() {
  const [qrUrl, setQrUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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
    const next = [...code]; next[i] = value.slice(-1);
    setCode(next);
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
        setCode(["", "", "", "", "", ""]); refs.current[0]?.focus();
      } else {
        router.push("/dashboard");
      }
    } catch { setError("Verification failed."); }
    setLoading(false);
  };

  const codeBox: React.CSSProperties = {
    width: 44, height: 52, background: I, border: `1px solid ${B}`, borderRadius: 10,
    textAlign: "center", fontSize: 22, fontWeight: 700, color: T, outline: "none", fontFamily: "Georgia, serif",
  };

  if (fetching) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${B}`, borderTopColor: G, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: T2, fontSize: 14 }}>Generating your 2FA setup...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 20, color: T, margin: "0 0 6px", fontWeight: 700 }}>
        Set Up Two-Factor Authentication
      </h1>
      <p style={{ fontSize: 13, color: T2, margin: "0 0 24px", lineHeight: 1.5 }}>
        2FA is mandatory for all corporate accounts. Scan the QR code with Google Authenticator, Authy, or any TOTP app.
      </p>

      {qrUrl && (
        <div style={{ background: I, borderRadius: 12, padding: 16, display: "inline-block", marginBottom: 16 }}>
          <img src={qrUrl} alt="2FA QR Code" style={{ width: 200, height: 200, display: "block" }} />
        </div>
      )}

      <div style={{ textAlign: "left", marginBottom: 20 }}>
        <label style={{ fontSize: 10, color: M, textTransform: "uppercase" as const, letterSpacing: "1px", display: "block", marginBottom: 4 }}>
          Manual entry key
        </label>
        <div style={{
          background: I, border: `1px solid ${B}`, borderRadius: 8, padding: "10px 14px",
          fontFamily: "monospace", fontSize: 12, color: G, letterSpacing: "1px", wordBreak: "break-all" as const, userSelect: "all" as const,
        }}>
          {secret}
        </div>
      </div>

      <p style={{ fontSize: 13, color: T2, margin: "0 0 4px", textAlign: "left" }}>Enter the 6-digit code from your app:</p>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "16px 0 20px" }}>
        {code.map((d, i) => (
          <input key={i} ref={el => { refs.current[i] = el; }}
            type="text" inputMode="numeric" maxLength={1} value={d}
            onChange={e => handleInput(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={e => { e.target.style.borderColor = GB; }}
            onBlur={e => { e.target.style.borderColor = B; }}
            style={codeBox}
          />
        ))}
      </div>

      {loading && <p style={{ fontSize: 12, color: G, textAlign: "center" }}>Verifying...</p>}

      {error && (
        <div style={{ background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.3)", borderRadius: 10, padding: "12px 16px", textAlign: "left" }}>
          <p style={{ fontSize: 13, color: R, margin: 0 }}>{error}</p>
        </div>
      )}
    </div>
  );
}

export default function Setup2FAPage() {
  const BG = "#07070a";
  const C = "#202028";
  const G = "#c9a84c";
  const B = "rgba(255,255,255,0.06)";
  const M = "#6b6969";

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-dm-sans, DM Sans, -apple-system, sans-serif)", padding: 16 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
        <a href="/" style={{ display: "inline-block", marginBottom: 8 }}>
          <img src="https://ausclear.au/AusClear-Light-Transparent.png" alt="AusClear" style={{ height: 36 }} />
        </a>
        <div style={{ fontSize: 10, color: G, textTransform: "uppercase", letterSpacing: "3px", fontWeight: 700, marginBottom: 36 }}>Corporate Portal</div>
        <div style={{ background: C, borderRadius: 16, padding: "36px 28px", border: `1px solid ${B}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${G}, transparent)` }} />
          <Suspense fallback={<p style={{ color: "#9a9898" }}>Loading...</p>}>
            <Setup2FAContent />
          </Suspense>
        </div>
        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 11, color: M }}>Nephthys Pty Ltd (ACN 628 031 587) trading as AusClear</p>
          <p style={{ fontSize: 11, color: M, marginTop: 4 }}>1300 027 423 · support@ausclear.com.au</p>
        </div>
      </div>
      <style>{`* { box-sizing: border-box; } html, body { margin: 0; padding: 0; background: ${BG}; }`}</style>
    </div>
  );
}
