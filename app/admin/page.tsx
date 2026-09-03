"use client";
import { useState, useEffect } from "react";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"accounts"|"audit"|"settings">("accounts");
  const [impersonating, setImpersonating] = useState<string|null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("admin_token")) {
      setAuthed(true);
      loadData();
    }
  }, []);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const res = await fetch("/api/admin/data");
      const d = await res.json();
      if (!d.error) setData(d);
    } catch {}
    setDataLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await res.json();
      if (d.ok) {
        sessionStorage.setItem("admin_token", d.token);
        setAuthed(true);
        loadData();
      } else setError(d.error || "Login failed");
    } catch { setError("Connection error"); }
    setLoading(false);
  };

  const toggleMaintenance = async () => {
    const current = data?.settings?.maintenance_mode === "true";
    await fetch("/api/admin/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_setting", key: "maintenance_mode", value: current ? "false" : "true" }),
    });
    loadData();
  };

  const updateMessage = async (msg: string) => {
    await fetch("/api/admin/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_setting", key: "maintenance_message", value: msg }),
    });
    loadData();
  };

  const impersonate = (acct: string) => {
    sessionStorage.setItem("account_number", acct);
    sessionStorage.setItem("admin_impersonate", "1");
    window.location.href = "/dashboard";
  };

  const fmtDate = (d: string) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleString("en-AU", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }); }
    catch { return d; }
  };

  const C = {
    bg: "#f4f5f7", card: "#ffffff", card2: "#f8f9fb", line: "#e2e4e9", text: "#1a1a2e",
    muted: "#6b6b7b", dim: "#a0a0a8", gold: "#9a7530", green: "#5cb87a", red: "#c05050",
    blue: "#3a76b0", amber: "#d4935c",
  };

  if (!authed) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(145deg, #f0f2f5, #e8ecf0)", fontFamily:"'Segoe UI',sans-serif" }}>
      <form onSubmit={handleLogin} style={{ width:380, background:"#fff", border:"1px solid #d8dce4", borderRadius:16, padding:"36px 28px", borderTop:"2px solid #c05050", boxShadow:"0 8px 30px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ width:48, height:48, margin:"0 auto 12px", borderRadius:10, background:"linear-gradient(135deg, #c05050, #9a3535)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:20, fontWeight:800, color:"#fff" }}>⚡</span>
          </div>
          <h1 style={{ fontSize:20, fontWeight:700, color:C.text, margin:0 }}>Admin Console</h1>
          <p style={{ fontSize:11, color:C.muted, marginTop:4 }}>AusClear Corporate Connect™</p>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:10, color:C.muted, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:600 }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="off"
            style={{ width:"100%", padding:"12px 14px", background:"#f8f9fb", border:`1px solid ${C.line}`, borderRadius:8, color:"#1a1a2e", fontSize:14, outline:"none", boxSizing:"border-box", WebkitTextFillColor:"#1a1a2e" }} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ display:"block", fontSize:10, color:C.muted, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:600 }}>Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password"
            style={{ width:"100%", padding:"12px 14px", background:"#f8f9fb", border:`1px solid ${C.line}`, borderRadius:8, color:"#1a1a2e", fontSize:14, outline:"none", boxSizing:"border-box", WebkitTextFillColor:"#1a1a2e" }} />
        </div>
        {error && <div style={{ background:"rgba(201,90,90,0.1)", border:"1px solid rgba(201,90,90,0.3)", borderRadius:8, padding:"8px 12px", marginBottom:14, color:C.red, fontSize:12 }}>⚠ {error}</div>}
        <button type="submit" disabled={loading} style={{ width:"100%", padding:"13px", background:"linear-gradient(135deg, #c05050, #9a3535)", border:"none", borderRadius:8, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>
          {loading ? "Verifying..." : "Sign In"}
        </button>
      </form>
    </div>
  );

  if (dataLoading && !data) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg, color:C.muted, fontFamily:"'Segoe UI',sans-serif" }}>Loading...</div>
  );

  const maintenance = data?.settings?.maintenance_mode === "true";
  const accounts = data?.accounts || [];
  const audit = data?.audit || [];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Segoe UI',sans-serif", color:C.text }}>
      {/* Top bar */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.line}`, padding:"12px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg, #c05050, #9a3535)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:14, fontWeight:800, color:"#fff" }}>⚡</span>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700 }}>Admin Console</div>
            <div style={{ fontSize:10, color:C.muted }}>AusClear Corporate Connect™</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {maintenance && <span style={{ fontSize:10, fontWeight:700, color:"#c05050", background:"rgba(201,90,90,0.1)", border:"1px solid rgba(201,90,90,0.3)", padding:"4px 12px", borderRadius:4, textTransform:"uppercase", letterSpacing:"0.1em" }}>🔒 Maintenance Mode</span>}
          <button onClick={() => { sessionStorage.removeItem("admin_token"); setAuthed(false); }}
            style={{ background:"none", border:`1px solid rgba(201,90,90,0.3)`, padding:"6px 14px", borderRadius:6, color:C.red, fontSize:11, fontWeight:600, cursor:"pointer" }}>Sign Out</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.line}`, padding:"0 24px", display:"flex", gap:0 }}>
        {(["accounts","audit","settings"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding:"14px 20px", border:"none", borderBottom:activeTab===t?`2px solid #c05050`:"2px solid transparent", background:"none", color:activeTab===t?C.text:C.muted, fontSize:13, fontWeight:activeTab===t?700:400, cursor:"pointer", textTransform:"capitalize" }}>
            {t === "accounts" ? `📁 Accounts (${accounts.length})` : t === "audit" ? `📋 Audit Log (${audit.length})` : "⚙️ Settings"}
          </button>
        ))}
      </div>

      <div style={{ padding:"24px", maxWidth:1200, margin:"0 auto" }}>
        {/* Accounts tab */}
        {activeTab === "accounts" && (
          <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12 }}>
            <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.line}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:15, fontWeight:700 }}>Registered Accounts</div>
              <button onClick={loadData} style={{ background:"none", border:`1px solid ${C.line}`, padding:"6px 12px", borderRadius:6, color:C.muted, fontSize:11, cursor:"pointer" }}>🔄 Refresh</button>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:C.card2 }}>
                    {["Account","Company","Contact","Stage","Nominees","Fees","Last Login","Actions"].map(h => (
                      <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, fontWeight:700, color:C.gold, textTransform:"uppercase", letterSpacing:"0.08em", borderBottom:`1px solid ${C.line}`, whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a: any) => (
                    <tr key={a.account_number} style={{ borderBottom:`1px solid ${C.line}` }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.card2}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                      <td style={{ padding:"12px 14px", fontFamily:"monospace", fontWeight:700, color:C.gold, fontSize:13 }}>{a.account_number}</td>
                      <td style={{ padding:"12px 14px", fontWeight:600, fontSize:13 }}>{a.company_name}</td>
                      <td style={{ padding:"12px 14px", fontSize:12, color:C.muted }}>
                        <div>{a.auth_contact}</div>
                        <div style={{ fontSize:10, color:C.dim }}>{a.auth_email}</div>
                      </td>
                      <td style={{ padding:"12px 14px", fontSize:11, color:C.muted }}>{a.corp_stage}</td>
                      <td style={{ padding:"12px 14px", fontSize:13, fontWeight:600, textAlign:"center" }}>{a.total_nominees}</td>
                      <td style={{ padding:"12px 14px", fontSize:13, fontWeight:600, color:C.gold, fontFamily:"monospace" }}>${(a.total_fees||0).toLocaleString()}</td>
                      <td style={{ padding:"12px 14px", fontSize:11, color:C.muted, whiteSpace:"nowrap" }}>{fmtDate(a.last_login)}</td>
                      <td style={{ padding:"12px 14px" }}>
                        <button onClick={() => impersonate(a.account_number)}
                          style={{ background:"rgba(58,118,176,0.1)", border:"1px solid rgba(58,118,176,0.3)", padding:"5px 12px", borderRadius:5, color:C.blue, fontSize:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                          👁 View Portal
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit tab */}
        {activeTab === "audit" && (
          <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12 }}>
            <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.line}` }}>
              <div style={{ fontSize:15, fontWeight:700 }}>Audit Log</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>All portal activity — admin and client logins, settings changes</div>
            </div>
            <div style={{ maxHeight:600, overflowY:"auto" }}>
              {audit.map((a: any) => (
                <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 20px", borderBottom:`1px solid ${C.line}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:14 }}>
                      {a.event_type === "admin_login" ? "🔑" : a.event_type === "client_login" ? "👤" : a.event_type === "setting_changed" ? "⚙️" : "📋"}
                    </span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{a.details || a.event_type}</div>
                      {a.account_number && <div style={{ fontSize:10, color:C.gold, fontFamily:"monospace" }}>{a.account_number}</div>}
                    </div>
                  </div>
                  <div style={{ fontSize:10, color:C.dim, whiteSpace:"nowrap" }}>{fmtDate(a.created_at)}</div>
                </div>
              ))}
              {audit.length === 0 && <div style={{ padding:40, textAlign:"center", color:C.dim }}>No activity yet</div>}
            </div>
          </div>
        )}

        {/* Settings tab */}
        {activeTab === "settings" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:600 }}>
            {/* Maintenance mode */}
            <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, padding:"20px 24px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700 }}>🔒 Maintenance Mode</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>When enabled, clients cannot log in. Admin access is unaffected.</div>
                </div>
                <button onClick={toggleMaintenance}
                  style={{ padding:"10px 20px", background:maintenance?"rgba(92,184,122,0.1)":"rgba(201,90,90,0.1)", border:`1px solid ${maintenance?"rgba(92,184,122,0.3)":"rgba(201,90,90,0.3)"}`, borderRadius:8, color:maintenance?C.green:C.red, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                  {maintenance ? "✓ Disable" : "Enable"}
                </button>
              </div>
              <div>
                <label style={{ display:"block", fontSize:10, color:C.muted, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:600 }}>Maintenance Message</label>
                <textarea defaultValue={data?.settings?.maintenance_message || ""}
                  onBlur={e => updateMessage(e.target.value)}
                  rows={3}
                  style={{ width:"100%", padding:"10px 12px", background:"#f8f9fb", border:`1px solid ${C.line}`, borderRadius:8, color:C.text, fontSize:12, outline:"none", boxSizing:"border-box", resize:"vertical", fontFamily:"inherit" }} />
              </div>
            </div>

            {/* Portal stats */}
            <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, padding:"20px 24px" }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>📊 Portal Stats</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                {[
                  { label:"Registered Accounts", value:accounts.length, col:C.blue },
                  { label:"Total Nominees", value:accounts.reduce((s:number,a:any)=>s+(a.total_nominees||0),0), col:C.green },
                  { label:"Total Fees", value:`$${accounts.reduce((s:number,a:any)=>s+(a.total_fees||0),0).toLocaleString()}`, col:C.gold },
                ].map((s,i) => (
                  <div key={i} style={{ background:C.card2, border:`1px solid ${C.line}`, borderRadius:8, padding:"14px", textAlign:"center" }}>
                    <div style={{ fontSize:22, fontWeight:700, color:s.col }}>{s.value}</div>
                    <div style={{ fontSize:9, color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em", marginTop:4, fontWeight:600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
