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

function Verify2FAContent() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  useEffect(() => {
    if (!email) { router.push("/login"); return; }
    setTimeout(() => refs.current[0]?.focus(), 100);
  }, [email, router]);

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
        router.refresh();
      }
    } catch { setError("Verification failed."); }
    setLoading(false);
  };

  const codeBox: React.CSSProperties = {
    width: 44, height: 52, background: I, border: `1px solid ${B}`, borderRadius: 10,
    textAlign: "center", fontSize: 22, fontWeight: 700, color: T, outline: "none", fontFamily: "Georgia, serif",
  };

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: T, margin: "0 0 6px", fontWeight: 700 }}>Two-Factor Authentication</h1>
      <p style={{ fontSize: 13, color: T2, margin: "0 0 4px" }}>Enter the 6-digit code from your authenticator app</p>
      <p style={{ fontSize: 12, color: M, margin: "0 0 24px", fontFamily: "monospace" }}>{email}</p>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "20px 0" }}>
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

      <button onClick={() => { router.push("/login"); }} style={{
        background: "none", border: "none", color: T2, fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginTop: 20,
      }}>
        ← Back to sign in
      </button>
    </div>
  );
}

export default function Verify2FAPage() {
  const BG = "#07070a"; const C = "#202028"; const G = "#c9a84c"; const B = "rgba(255,255,255,0.06)"; const M = "#6b6969";
  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-dm-sans, DM Sans, -apple-system, sans-serif)", padding: 16 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
        <a href="/" style={{ display: "inline-block", marginBottom: 8 }}>
          <img src="https://ausclear.au/AusClear-Light-Transparent.png" alt="AusClear" style={{ height: 36 }} />
        </a>
        <div style={{ fontSize: 10, color: G, textTransform: "uppercase", letterSpacing: "3px", fontWeight: 700, marginBottom: 36 }}>Corporate Portal</div>
        <div style={{ background: C, borderRadius: 16, padding: "36px 28px", border: `1px solid ${B}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${G}, transparent)` }} />
          <Suspense fallback={<p style={{ color: "#9a9898" }}>Loading...</p>}>
            <Verify2FAContent />
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
