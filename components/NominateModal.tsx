"use client";
import React, { useState, useEffect } from "react";

type Employee = {
  id: string; first_name: string; last_name: string;
  email: string; mobile: string; clearance_type: string; clearance_request_type: string;
};

const CLEARANCE_TYPES = ["Baseline","NV1","NV2"];
const REQUEST_TYPES   = ["New","Upgrade","Transfer"];

function blank(): Employee {
  return { id: Math.random().toString(36).slice(2), first_name:"", last_name:"",
    email:"", mobile:"", clearance_type:"", clearance_request_type:"" };
}

export default function NominateModal({ onClose, onSubmit, theme = "dark" }:
  { onClose:()=>void; onSubmit?:(employees:Employee[])=>void; theme?: "dark"|"light" }) {

  const isDark = theme === "dark";
  const P = {
    bg:    isDark ? "#07070a" : "#f4f5f7",
    card:  isDark ? "#111318" : "#ffffff",
    card2: isDark ? "#161922" : "#f8f9fa",
    line:  isDark ? "#1f2535" : "#e2e4e9",
    gold:  isDark ? "#c9a84c" : "#2563b0",
    text:  isDark ? "#e8e5de" : "#1a1a2e",
    muted: isDark ? "#7a7a82" : "#6b6b7b",
    dim:   isDark ? "#4a4a52" : "#9a9aaa",
    green: isDark ? "#5cb87a" : "#2d8a4e",
  };

  const cell: React.CSSProperties = {
    background:P.card, border:`1px solid ${P.line}`, color:P.text,
    padding:"9px 10px", fontSize:13, outline:"none", width:"100%",
    boxSizing:"border-box" as const,
    fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    WebkitTextFillColor:P.text,
    opacity:1,
  };

  const [step,       setStep]       = useState<"count"|"form">("count");
  const [count,      setCount]      = useState(1);
  const [employees,  setEmployees]  = useState<Employee[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [isMobile,   setIsMobile]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleCountConfirm = () => {
    setEmployees(Array.from({ length: count }, blank));
    setStep("form");
  };

  const update = (id:string, field:keyof Employee, val:string) =>
    setEmployees(p => p.map(e => e.id===id ? {...e,[field]:val} : e));

  const remove = (id:string) => {
    const next = employees.filter(e => e.id!==id);
    setEmployees(next);
    setCount(next.length);
  };

  const allValid = employees.length > 0 && employees.every(e =>
    e.first_name && e.last_name && e.email && e.clearance_type && e.clearance_request_type);

  const handleSubmit = async () => {
    if (!allValid) return;
    setSubmitting(true);
    setProgress(0);
    const progTimer = setInterval(() => setProgress(p => Math.min(p + Math.random() * 15, 90)), 300);
    try {
      const acct = sessionStorage.getItem("account_number") || "";
      const res = await fetch("/api/dashboard/nominate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_number: acct,
          employees: employees.map(e => ({
            first_name: e.first_name,
            last_name: e.last_name,
            email: e.email,
            mobile: e.mobile,
            clearance_type: e.clearance_type,
            request_type: e.clearance_request_type,
          })),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        clearInterval(progTimer);
        setProgress(100);
        setTimeout(() => { setSubmitted(true); }, 400);
        if (onSubmit) onSubmit(employees);
      } else {
        clearInterval(progTimer);
        setProgress(0);
        alert(data.error || "Failed to nominate employees. Please try again.");
      }
    } catch {
      clearInterval(progTimer);
      setProgress(0);
      alert("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  const isFormStep = !submitted && step === "form";
  const shell: React.CSSProperties = isMobile
    ? { position:"fixed", bottom:0, left:0, right:0, top:0,
        background:P.bg, zIndex:201, display:"flex", flexDirection:"column" }
    : { position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        width:isFormStep ? "min(1000px,96vw)" : "min(420px,90vw)", maxHeight:"90vh",
        background:P.bg, border:`1px solid ${P.line}`, borderRadius:12,
        zIndex:201, display:"flex", flexDirection:"column",
        boxShadow:isDark?"0 24px 64px rgba(0,0,0,0.8)":"0 24px 64px rgba(0,0,0,0.15)",
        transition:"width 0.2s ease" };

  const COLS = [
    { label:"First Name", field:"first_name" as keyof Employee, required:true,  type:"text",  placeholder:"First name",         w:130 },
    { label:"Last Name",  field:"last_name"  as keyof Employee, required:true,  type:"text",  placeholder:"Last name",          w:130 },
    { label:"Email",      field:"email"      as keyof Employee, required:true,  type:"email", placeholder:"name@personal.com",  w:200, tooltip:"AGSVA requires a personal email address, not a company email" },
    { label:"Mobile",     field:"mobile"     as keyof Employee, required:false, type:"tel",   placeholder:"04xx xxx xxx",       w:130 },
    { label:"Clearance",  field:"clearance_type" as keyof Employee, required:true, type:"select", placeholder:"", w:180 },
    { label:"Request",    field:"clearance_request_type" as keyof Employee, required:true, type:"select", placeholder:"", w:110 },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", zIndex:200, backdropFilter:"blur(4px)" }} />
      <div style={shell}>

        {isMobile
          ? <div style={{ display:"flex", justifyContent:"center", padding:"14px 0 6px", flexShrink:0 }}>
              <div style={{ width:36, height:4, borderRadius:2, background:"#2a2a3a" }} />
            </div>
          : <div style={{ height:3, background:`linear-gradient(90deg,${P.gold},transparent)`, borderRadius:"8px 8px 0 0", flexShrink:0 }} />
        }

        {/* Header */}
        <div style={{ padding:isMobile?"8px 20px 14px":"16px 22px 14px",
          borderBottom:`1px solid ${P.line}`, display:"flex", justifyContent:"space-between",
          alignItems:"center", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:isMobile?20:18, fontWeight:700, color:P.text }}>Nominate Employees</div>
            <div style={{ fontSize:13, color:P.muted, marginTop:3 }}>
              {step==="count" ? "How many employees are you nominating?" : `${employees.length} employee${employees.length!==1?"s":""} · required fields marked *`}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:`1px solid ${P.line}`,
            color:P.muted, padding:"8px 14px", cursor:"pointer", borderRadius:6,
            fontSize:15, fontFamily:"inherit", minWidth:44, minHeight:44 }}>✕</button>
        </div>

        {submitted ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"auto" }}>
            <div style={{ background:isDark?"rgba(107,159,212,0.1)":"rgba(37,99,176,0.06)", padding:"28px 24px", textAlign:"center" as const }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:P.gold, display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                <span style={{ fontSize:26, color:isDark?"#07070a":"#fff" }}>✓</span>
              </div>
              <div style={{ fontSize:18, fontWeight:700, color:P.gold, marginBottom:4 }}>Nomination submitted</div>
              <div style={{ fontSize:13, color:P.muted }}>{employees.length} employee{employees.length!==1?"s have":" has"} been submitted for clearance sponsorship</div>
            </div>
            <div style={{ padding:"20px 24px", flex:1 }}>
              <div style={{ fontSize:12, color:P.muted, fontWeight:600, marginBottom:12 }}>What happens next</div>
              {[
                { num:"1", title:"AusClear reviews your nominations", sub:"Within 1 business day" },
                { num:"2", title:"Employees receive onboarding emails", sub:"Application forms and next steps" },
                { num:"3", title:"Track progress in your dashboard", sub:"Real-time status updates on the Personnel tab" },
              ].map(s => (
                <div key={s.num} style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:14 }}>
                  <div style={{ width:24, height:24, borderRadius:"50%", background:isDark?"rgba(107,159,212,0.15)":"rgba(37,99,176,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:P.gold }}>{s.num}</span>
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:P.text }}>{s.title}</div>
                    <div style={{ fontSize:12, color:P.muted }}>{s.sub}</div>
                  </div>
                </div>
              ))}
              <div style={{ borderTop:`1px solid ${P.line}`, paddingTop:14, marginTop:6, display:"flex", gap:8 }}>
                <button onClick={() => { onClose(); setTimeout(() => { const el = document.querySelector('[data-tab="personnel"]') as HTMLElement; if (el) el.click(); }, 100); }}
                  style={{ flex:1, padding:"11px", border:`1px solid ${P.line}`, background:"transparent", borderRadius:8, color:P.text, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>View personnel</button>
                <button onClick={onClose}
                  style={{ flex:1, padding:"11px", background:P.gold, border:"none", borderRadius:8, color:isDark?"#07070a":"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Done</button>
              </div>
            </div>
          </div>

        ) : step === "count" ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", padding:"32px 24px" }}>
            <div style={{ fontSize:14, color:P.muted, marginBottom:24, textAlign:"center" as const }}>
              Select the number of employees to nominate
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:40 }}>
              <button onClick={() => setCount(c => Math.max(1, c-1))}
                style={{ width:52, height:52, borderRadius:"50%", background:P.card2,
                  border:`1px solid ${P.line}`, color:P.text, fontSize:22, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" }}>−</button>
              <div style={{ textAlign:"center" as const }}>
                <div style={{ fontSize:56, fontWeight:700, color:P.gold, lineHeight:1 }}>{count}</div>
                <div style={{ fontSize:12, color:P.muted, marginTop:4 }}>employee{count!==1?"s":""}</div>
              </div>
              <button onClick={() => setCount(c => Math.min(20, c+1))}
                style={{ width:52, height:52, borderRadius:"50%", background:P.card2,
                  border:`1px solid ${P.line}`, color:P.text, fontSize:22, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" }}>+</button>
            </div>
            <div style={{ display:"flex", gap:10, marginBottom:40, flexWrap:"wrap" as const, justifyContent:"center" }}>
              {[1,2,3,5,10].map(n => (
                <button key={n} onClick={() => setCount(n)}
                  style={{ padding:"8px 18px", borderRadius:6, cursor:"pointer", fontSize:13,
                    fontFamily:"inherit", fontWeight:count===n?700:400,
                    background:count===n?"rgba(201,168,76,0.15)":P.card2,
                    border:`1px solid ${count===n?P.gold:P.line}`,
                    color:count===n?P.gold:P.muted }}>{n}</button>
              ))}
            </div>
            <button onClick={handleCountConfirm}
              style={{ background:P.gold, border:"none", padding:"14px 48px",
                color:P.bg, fontWeight:700, cursor:"pointer", borderRadius:8,
                fontSize:15, fontFamily:"inherit", width:"100%", maxWidth:320 }}>
              Continue →
            </button>
          </div>

        ) : (
          /* ── STEP 2: horizontal subform table ── */
          <>
            <div style={{ flex:1, overflowX:"auto", overflowY:"auto" }}>
              <table style={{ borderCollapse:"collapse" as const, width:"100%", minWidth:880 }}>
                <thead>
                  <tr style={{ background:P.card2, position:"sticky", top:0, zIndex:10 }}>
                    <th style={{ width:40, padding:"10px 8px", borderBottom:`2px solid ${P.gold}`,
                      borderRight:`1px solid ${P.line}`, color:P.dim, fontSize:10 }}>#</th>
                    {COLS.map(c => (
                      <th key={c.field} style={{ padding:"10px 10px", borderBottom:`2px solid ${P.gold}`,
                        borderRight:`1px solid ${P.line}`, textAlign:"left" as const,
                        fontSize:10, fontWeight:700, color:P.gold,
                        textTransform:"uppercase" as const, letterSpacing:"0.1em",
                        whiteSpace:"nowrap" as const, minWidth:c.w }}>
                        {c.label}{c.required && <span style={{ color:"#c97a7a" }}> *</span>}
                        {(c as any).tooltip && <span title={(c as any).tooltip} style={{ cursor:"help", marginLeft:4, fontSize:11, color:P.gold, fontWeight:700 }}>ⓘ</span>}
                      </th>
                    ))}
                    <th style={{ width:50, padding:"10px 8px", borderBottom:`2px solid ${P.gold}`,
                      color:P.dim, fontSize:10 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => {
                    const rowValid = emp.first_name && emp.last_name && emp.email &&
                                     emp.clearance_type && emp.clearance_request_type;
                    return (
                      <tr key={emp.id}
                        style={{ background:i%2===0?P.card:P.card2,
                          borderBottom:`1px solid ${P.line}` }}>
                        {/* Row number */}
                        <td style={{ padding:"6px 8px", borderRight:`1px solid ${P.line}`,
                          textAlign:"center" as const, color:rowValid?P.green:P.dim,
                          fontSize:11, fontWeight:700 }}>
                          {rowValid ? "✓" : i+1}
                        </td>
                        {/* Input cells */}
                        {COLS.map(col => (
                          <td key={col.field} style={{ padding:0, borderRight:`1px solid ${P.line}` }}>
                            {col.type === "select" ? (
                              <select value={emp[col.field]} onChange={e => update(emp.id, col.field, e.target.value)}
                                style={{ ...cell, borderRadius:0, border:"none",
                                  borderBottom:`2px solid ${emp[col.field]?P.gold:"transparent"}`,
                                  color:emp[col.field]?P.text:P.dim,
                                  WebkitTextFillColor:emp[col.field]?P.text:P.dim,
                                  backgroundColor:P.card }}>
                                <option value="" style={{ color:"#999" }}>Select...</option>
                                {(col.field==="clearance_type" ? CLEARANCE_TYPES : REQUEST_TYPES).map(o => (
                                  <option key={o} value={o} style={{ color:"#1a1a2e", backgroundColor:"#fff" }}>{o}</option>
                                ))}
                              </select>
                            ) : (
                              <input type={col.type} value={emp[col.field]}
                                placeholder={col.placeholder}
                                onChange={e => update(emp.id, col.field, e.target.value)}
                                style={{ ...cell, borderRadius:0, border:"none",
                                  borderBottom:`2px solid ${emp[col.field]?P.gold:"transparent"}` }} />
                            )}
                          </td>
                        ))}
                        {/* Remove */}
                        <td style={{ padding:"6px 8px", textAlign:"center" as const }}>
                          {employees.length > 1 && (
                            <button onClick={() => remove(emp.id)}
                              style={{ background:"none", border:"none", color:"#c97a7a",
                                cursor:"pointer", fontSize:16, padding:"2px 6px",
                                fontFamily:"inherit", lineHeight:1 }}>✕</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ padding:isMobile?"14px 16px":"14px 22px",
              borderTop:`1px solid ${P.line}`, flexShrink:0, background:P.card,
              display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, flexWrap:"wrap" as const }}>
              <div style={{ fontSize:12, color:P.dim }}>
                {allValid ? `${employees.length} employee${employees.length!==1?"s":""} ready` : "Complete all required fields *"}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setStep("count")}
                  style={{ background:"none", border:`1px solid ${P.line}`, color:P.muted,
                    padding:"10px 18px", cursor:"pointer", borderRadius:6,
                    fontSize:13, fontFamily:"inherit" }}>← Back</button>
                {submitting && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:11, color:P.muted }}>Submitting nominations...</span>
                      <span style={{ fontSize:11, fontWeight:700, color:P.gold }}>{Math.round(progress)}%</span>
                    </div>
                    <div style={{ height:6, background:P.line, borderRadius:4, overflow:"hidden" }}>
                      <div style={{ height:"100%", background:P.gold, borderRadius:4, width:`${progress}%`, transition:"width 0.3s ease" }} />
                    </div>
                  </div>
                )}
                <button onClick={handleSubmit} disabled={!allValid||submitting}
                  style={{ background:allValid?P.gold:(isDark?"#2a2a32":"#e0e0e5"), border:"none",
                    color:allValid?(isDark?"#07070a":"#ffffff"):P.dim,
                    padding:"10px 24px", cursor:allValid?"pointer":"not-allowed",
                    borderRadius:6, fontSize:13, fontWeight:700, fontFamily:"inherit" }}>
                  {submitting ? "Submitting..." : `Submit ${employees.length>1?employees.length+" Employees":"Employee"}`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
