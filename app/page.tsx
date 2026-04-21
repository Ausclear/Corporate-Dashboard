"use client";

import { useRouter } from "next/navigation";

const G = "#c9a84c";
const BG = "#07070a";
const C = "#202028";
const T = "#e8e6e1";
const T2 = "#9a9898";
const M = "#6b6969";
const B = "rgba(255,255,255,0.06)";

export default function LandingPage() {
  const router = useRouter();

  const btn = (primary: boolean): React.CSSProperties => ({
    padding: "14px 32px",
    border: primary ? "none" : `1px solid ${G}`,
    borderRadius: 10,
    background: primary ? `linear-gradient(135deg, ${G}, #b8942e)` : "transparent",
    color: primary ? BG : G,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.3px",
    transition: "opacity 0.2s",
  });

  const features = [
    { icon: "🔐", title: "Secure Access", desc: "Email and password authentication with mandatory two-factor authentication for all accounts." },
    { icon: "📋", title: "Clearance Management", desc: "Monitor all sponsored personnel, clearance levels, expiry dates, and pending applications in one place." },
    { icon: "💼", title: "Contract & Invoicing", desc: "View your sponsorship contract, track renewal dates, and download invoices directly from the portal." },
    { icon: "🔔", title: "Real-Time Alerts", desc: "Receive notifications for upcoming renewals, application status changes, and AGSVA decisions." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "var(--font-dm-sans, DM Sans, -apple-system, sans-serif)", color: T }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${B}`, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <img src="https://ausclear.au/AusClear-Light-Transparent.png" alt="AusClear" style={{ height: 28 }} />
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => router.push("/login")} style={{ ...btn(false), padding: "10px 24px", fontSize: 14 }}>
            Sign In
          </button>
          <button onClick={() => router.push("/register")} style={{ ...btn(true), padding: "10px 24px", fontSize: 14 }}>
            Create Account
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "96px 40px 80px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: G, textTransform: "uppercase", letterSpacing: "4px", fontWeight: 700, marginBottom: 24 }}>
          Corporate Client Portal
        </div>
        <h1 style={{
          fontFamily: "Playfair Display, Georgia, serif",
          fontSize: "clamp(36px, 5vw, 58px)",
          fontWeight: 700,
          color: T,
          margin: "0 0 24px",
          lineHeight: 1.15,
        }}>
          Manage Your Security<br />Clearance Programme
        </h1>
        <p style={{ fontSize: 17, color: T2, maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.7 }}>
          The AusClear corporate dashboard gives your security team complete visibility over sponsored clearances, applications, and compliance obligations.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => router.push("/register")} style={btn(true)}>
            Create Account
          </button>
          <button onClick={() => router.push("/login")} style={btn(false)}>
            Sign In
          </button>
        </div>

        {/* Gold line divider */}
        <div style={{ width: 60, height: 2, background: `linear-gradient(90deg, transparent, ${G}, transparent)`, margin: "80px auto 0" }} />
      </div>

      {/* Features */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 40px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: C,
              border: `1px solid ${B}`,
              borderRadius: 16,
              padding: "32px 28px",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${G}, transparent)` }} />
              <div style={{ fontSize: 28, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 16, color: T, margin: "0 0 10px", fontWeight: 700 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: T2, margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div style={{ borderTop: `1px solid ${B}`, borderBottom: `1px solid ${B}` }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "64px 40px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 28, color: T, margin: "0 0 16px" }}>
            Already sponsored with AusClear?
          </h2>
          <p style={{ fontSize: 15, color: T2, margin: "0 0 32px", lineHeight: 1.6 }}>
            Create your corporate account using your registered email address. First-time access requires verification by our team.
          </p>
          <button onClick={() => router.push("/register")} style={btn(true)}>
            Get Started
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: M, margin: "0 0 6px" }}>
          Nephthys Pty Ltd (ACN 628 031 587) trading as AusClear
        </p>
        <p style={{ fontSize: 12, color: M }}>
          1300 027 423 · support@ausclear.com.au · DISP Accredited
        </p>
      </div>

      <style>{`* { box-sizing: border-box; } html, body { margin: 0; padding: 0; background: ${BG}; }`}</style>
    </div>
  );
}
