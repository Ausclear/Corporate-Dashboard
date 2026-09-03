"use client";
import { useState, useEffect } from "react";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"accounts"|"approvals"|"audit"|"settings">("accounts");
  const [resetPinAcct, setResetPinAcct] = useState<string|null>(null);
  const [resetPinVal, setResetPinVal] = useState("");
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

  const setAccountStatus = async (acct: string, status: string) => {
    await fetch("/api/admin/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_status", account_number: acct, value: status }),
    });
    loadData();
  };

  const handleResetPin = async () => {
    if (!resetPinAcct || !/^\d{6}$/.test(resetPinVal)) return;
    await fetch("/api/admin/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_pin", account_number: resetPinAcct, value: resetPinVal }),
    });
    setResetPinAcct(null);
    setResetPinVal("");
    loadData();
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
          <div style={{ position:"relative" as const }}>
            <input value={password} onChange={e => setPassword(e.target.value)} type={showPw ? "text" : "password"}
              style={{ width:"100%", padding:"12px 42px 12px 14px", background:"#f8f9fb", border:`1px solid ${C.line}`, borderRadius:8, color:"#1a1a2e", fontSize:14, outline:"none", boxSizing:"border-box", WebkitTextFillColor:"#1a1a2e" }} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ position:"absolute" as const, right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:C.muted, padding:4 }}>
              {showPw ? "🙈" : "👁"}
            </button>
          </div>
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
        {(["accounts","approvals","audit","settings"] as const).map(t => {
          const pendingCount = accounts.filter((a: any) => a.status === "pending").length;
          const label = t === "accounts" ? `📁 Accounts (${accounts.filter((a:any)=>a.status!=="pending").length})`
            : t === "approvals" ? `⏳ Approvals${pendingCount > 0 ? ` (${pendingCount})` : ""}`
            : t === "audit" ? `📋 Audit (${audit.length})`
            : "⚙️ Settings";
          return (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding:"14px 20px", border:"none", borderBottom:activeTab===t?`2px solid #c05050`:"2px solid transparent", background:"none", color:activeTab===t?C.text:C.muted, fontSize:13, fontWeight:activeTab===t?700:400, cursor:"pointer" }}>
            {label}
            {t === "approvals" && pendingCount > 0 && <span style={{ marginLeft:6, background:"#c05050", color:"#fff", fontSize:9, fontWeight:700, borderRadius:10, padding:"2px 7px" }}>{pendingCount}</span>}
          </button>
          );
        })}
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
                    {["Account","Company","Contact","Status","Stage","Nominees","Fees","Last Login","Actions"].map(h => (
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
                      <td style={{ padding:"12px 14px", fontSize:11, color:C.muted }}>
                        <div>{a.auth_contact}</div>
                        <div style={{ fontSize:10, color:C.dim }}>{a.auth_email}</div>
                      </td>
                      <td style={{ padding:"12px 14px" }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:4,
                          background: a.status==="approved"?"rgba(92,184,122,0.1)":a.status==="pending"?"rgba(212,147,92,0.1)":"rgba(201,80,80,0.1)",
                          color: a.status==="approved"?C.green:a.status==="pending"?C.amber:C.red,
                          border:`1px solid ${a.status==="approved"?"rgba(92,184,122,0.3)":a.status==="pending"?"rgba(212,147,92,0.3)":"rgba(201,80,80,0.3)"}`,
                          textTransform:"uppercase", letterSpacing:"0.05em" }}>{a.status || "approved"}</span>
                      </td>
                      <td style={{ padding:"12px 14px", fontSize:11, color:C.muted }}>{a.corp_stage}</td>
                      <td style={{ padding:"12px 14px", fontSize:13, fontWeight:600, textAlign:"center" }}>{a.total_nominees}</td>
                      <td style={{ padding:"12px 14px", fontSize:13, fontWeight:600, color:C.gold, fontFamily:"monospace" }}>${(a.total_fees||0).toLocaleString()}</td>
                      <td style={{ padding:"12px 14px", fontSize:11, color:C.muted, whiteSpace:"nowrap" }}>{fmtDate(a.last_login)}</td>
                      <td style={{ padding:"12px 14px", display:"flex", gap:6 }}>
                        <button onClick={() => maintenance ? impersonate(a.account_number) : null}
                          disabled={!maintenance}
                          title={maintenance ? "View this client's portal" : "Enable maintenance mode first"}
                          style={{ background: maintenance ? "rgba(58,118,176,0.1)" : "#f0f0f2", border: `1px solid ${maintenance ? "rgba(58,118,176,0.3)" : "#e0e0e4"}`, padding:"5px 12px", borderRadius:5, color: maintenance ? C.blue : "#b0b0b8", fontSize:10, fontWeight:700, cursor: maintenance ? "pointer" : "not-allowed", whiteSpace:"nowrap" }}>
                          👁 View Portal
                        </button>
                        <button onClick={() => { setResetPinAcct(a.account_number); setResetPinVal(""); }}
                          style={{ background:"rgba(154,117,48,0.08)", border:"1px solid rgba(154,117,48,0.2)", padding:"5px 12px", borderRadius:5, color:C.gold, fontSize:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                          🔑 Reset PIN
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Approvals tab */}
        {activeTab === "approvals" && (() => {
          const pending = accounts.filter((a: any) => a.status === "pending");
          return (
            <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12 }}>
              <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.line}` }}>
                <div style={{ fontSize:15, fontWeight:700 }}>Registration Approvals</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>New registrations waiting for approval</div>
              </div>
              {pending.length === 0 ? (
                <div style={{ padding:40, textAlign:"center", color:C.muted }}>No pending registrations</div>
              ) : (
                pending.map((a: any) => (
                  <div key={a.account_number} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", borderBottom:`1px solid ${C.line}` }}>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontFamily:"monospace", fontWeight:700, color:C.gold, fontSize:13 }}>{a.account_number}</span>
                        <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{a.company_name}</span>
                      </div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>
                        Contact: {a.auth_contact} · {a.auth_email}
                      </div>
                      <div style={{ fontSize:10, color:C.dim, marginTop:2 }}>
                        Registered: {fmtDate(a.registered_at)}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={() => setAccountStatus(a.account_number, "approved")}
                        style={{ background:"rgba(92,184,122,0.1)", border:"1px solid rgba(92,184,122,0.3)", padding:"8px 16px", borderRadius:6, color:C.green, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                        ✓ Approve
                      </button>
                      <button onClick={() => setAccountStatus(a.account_number, "rejected")}
                        style={{ background:"rgba(201,80,80,0.06)", border:"1px solid rgba(201,80,80,0.2)", padding:"8px 16px", borderRadius:6, color:C.red, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })()}

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
                  style={{ width:"100%", padding:"10px 12px", background:"#f8f9fb", border:`1px solid ${C.line}`, borderRadius:8, color:"#1a1a2e", fontSize:12, outline:"none", boxSizing:"border-box", resize:"vertical", fontFamily:"inherit", WebkitTextFillColor:"#1a1a2e" }} />
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

      {/* PIN Reset Modal */}
      {resetPinAcct && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }} onClick={() => setResetPinAcct(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:12, padding:"28px 24px", width:360, border:"1px solid #e2e4e9" }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#1a1a2e", marginBottom:4 }}>Reset PIN</div>
            <div style={{ fontSize:12, color:"#6b6b7b", marginBottom:20 }}>Set a new 6-digit PIN for <span style={{ fontFamily:"monospace", fontWeight:700, color:"#9a7530" }}>{resetPinAcct}</span></div>
            <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:20 }}>
              {[0,1,2,3,4,5].map(i => (
                <input key={i} id={`rpin-${i}`} type="text" inputMode="numeric" maxLength={1}
                  value={resetPinVal[i] || ""}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, "");
                    if (!v && resetPinVal[i]) { setResetPinVal(resetPinVal.slice(0,i) + resetPinVal.slice(i+1)); return; }
                    if (!v) return;
                    setResetPinVal(resetPinVal.slice(0,i) + v[0] + resetPinVal.slice(i+1));
                    if (i < 5) document.getElementById(`rpin-${i+1}`)?.focus();
                  }}
                  onKeyDown={e => { if (e.key === "Backspace" && !resetPinVal[i] && i > 0) document.getElementById(`rpin-${i-1}`)?.focus(); }}
                  style={{ width:44, height:52, textAlign:"center", fontSize:20, fontWeight:700, background:"#f8f9fb", border:`1px solid ${resetPinVal[i] ? "rgba(154,117,48,0.3)" : "#e2e4e9"}`, borderRadius:8, color:"#1a1a2e", outline:"none", boxSizing:"border-box", WebkitTextFillColor:"#1a1a2e" }} />
              ))}
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={() => setResetPinAcct(null)}
                style={{ padding:"9px 18px", border:"1px solid #e2e4e9", background:"#fff", borderRadius:6, color:"#6b6b7b", fontSize:12, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={handleResetPin} disabled={resetPinVal.length !== 6}
                style={{ padding:"9px 18px", border:"none", background:resetPinVal.length===6 ? "linear-gradient(135deg, #c05050, #9a3535)" : "#e8e8f0", borderRadius:6, color:resetPinVal.length===6 ? "#fff" : "#b0b0b8", fontSize:12, fontWeight:700, cursor:resetPinVal.length===6 ? "pointer" : "not-allowed" }}>Reset PIN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
