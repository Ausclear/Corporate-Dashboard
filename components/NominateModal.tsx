"use client";
import React, { useState, useEffect } from "react";

type Employee = {
  id: string; first_name: string; last_name: string;
  email: string; mobile: string; clearance_type: string; clearance_request_type: string;
};

const CLEARANCE_TYPES = ["Baseline Security Clearance","NV1 Security Clearance","NV2 Security Clearance"];
const REQUEST_TYPES   = ["New","Upgrade","Transfer"];

function blank(): Employee {
  return { id: Math.random().toString(36).slice(2), first_name:"", last_name:"",
    email:"", mobile:"", clearance_type:"", clearance_request_type:"New" };
}

const cell: React.CSSProperties = {
  background:"#111318", border:"1px solid #1f2535", color:"#e8e5de",
  padding:"9px 10px", fontSize:13, outline:"none", width:"100%",
  boxSizing:"border-box" as const,
  fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
};

export default function NominateModal({ onClose, onSubmit }:
  { onClose:()=>void; onSubmit?:(employees:Employee[])=>void }) {

  const [step,       setStep]       = useState<"count"|"form">("count");
  const [count,      setCount]      = useState(1);
  const [employees,  setEmployees]  = useState<Employee[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
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
    await new Promise(r => setTimeout(r, 600));
    setSubmitted(true);
    setSubmitting(false);
    if (onSubmit) onSubmit(employees);
  };

  const shell: React.CSSProperties = isMobile
    ? { position:"fixed", bottom:0, left:0, right:0, top:0,
        background:"#07070a", zIndex:201, display:"flex", flexDirection:"column" }
    : { position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        width:"min(1000px,96vw)", maxHeight:"90vh",
        background:"#07070a", border:"1px solid #1f2535", borderRadius:8,
        zIndex:201, display:"flex", flexDirection:"column",
        boxShadow:"0 24px 64px rgba(0,0,0,0.8)" };

  const COLS = [
    { label:"First Name", field:"first_name" as keyof Employee, required:true,  type:"text",  placeholder:"First name",         w:130 },
    { label:"Last Name",  field:"last_name"  as keyof Employee, required:true,  type:"text",  placeholder:"Last name",          w:130 },
    { label:"Email",      field:"email"      as keyof Employee, required:true,  type:"email", placeholder:"email@company.com",  w:200 },
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
          : <div style={{ height:3, background:"linear-gradient(90deg,#c9a84c,transparent)", borderRadius:"8px 8px 0 0", flexShrink:0 }} />
        }

        {/* Header */}
        <div style={{ padding:isMobile?"8px 20px 14px":"16px 22px 14px",
          borderBottom:"1px solid #1f2535", display:"flex", justifyContent:"space-between",
          alignItems:"center", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:isMobile?20:18, fontWeight:700, color:"#e8e5de" }}>Nominate Employees</div>
            <div style={{ fontSize:13, color:"#7a7a82", marginTop:3 }}>
              {step==="count" ? "How many employees are you nominating?" : `${employees.length} employee${employees.length!==1?"s":""} · required fields marked *`}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"1px solid #1f2535",
            color:"#7a7a82", padding:"8px 14px", cursor:"pointer", borderRadius:6,
            fontSize:15, fontFamily:"inherit", minWidth:44, minHeight:44 }}>✕</button>
        </div>

        {submitted ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", padding:40 }}>
            <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(92,184,122,0.12)",
              border:"1px solid rgba(92,184,122,0.35)", display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:26, marginBottom:16 }}>✓</div>
            <div style={{ fontSize:18, fontWeight:700, color:"#5cb87a", marginBottom:8 }}>Nomination Submitted</div>
            <div style={{ fontSize:14, color:"#7a7a82", textAlign:"center" as const }}>
              {employees.length} employee{employees.length!==1?"s":""} nominated.
            </div>
            <button onClick={onClose} style={{ marginTop:28, background:"#c9a84c", border:"none",
              padding:"14px 36px", color:"#07070a", fontWeight:700, cursor:"pointer",
              borderRadius:8, fontSize:15, fontFamily:"inherit" }}>Done</button>
          </div>

        ) : step === "count" ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", padding:"32px 24px" }}>
            <div style={{ fontSize:14, color:"#7a7a82", marginBottom:24, textAlign:"center" as const }}>
              Select the number of employees to nominate
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:40 }}>
              <button onClick={() => setCount(c => Math.max(1, c-1))}
                style={{ width:52, height:52, borderRadius:"50%", background:"#161922",
                  border:"1px solid #1f2535", color:"#e8e5de", fontSize:22, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" }}>−</button>
              <div style={{ textAlign:"center" as const }}>
                <div style={{ fontSize:56, fontWeight:700, color:"#c9a84c", lineHeight:1 }}>{count}</div>
                <div style={{ fontSize:12, color:"#7a7a82", marginTop:4 }}>employee{count!==1?"s":""}</div>
              </div>
              <button onClick={() => setCount(c => Math.min(20, c+1))}
                style={{ width:52, height:52, borderRadius:"50%", background:"#161922",
                  border:"1px solid #1f2535", color:"#e8e5de", fontSize:22, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" }}>+</button>
            </div>
            <div style={{ display:"flex", gap:10, marginBottom:40, flexWrap:"wrap" as const, justifyContent:"center" }}>
              {[1,2,3,5,10].map(n => (
                <button key={n} onClick={() => setCount(n)}
                  style={{ padding:"8px 18px", borderRadius:6, cursor:"pointer", fontSize:13,
                    fontFamily:"inherit", fontWeight:count===n?700:400,
                    background:count===n?"rgba(201,168,76,0.15)":"#161922",
                    border:`1px solid ${count===n?"#c9a84c":"#1f2535"}`,
                    color:count===n?"#c9a84c":"#7a7a82" }}>{n}</button>
              ))}
            </div>
            <button onClick={handleCountConfirm}
              style={{ background:"#c9a84c", border:"none", padding:"14px 48px",
                color:"#07070a", fontWeight:700, cursor:"pointer", borderRadius:8,
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
                  <tr style={{ background:"#0d1018", position:"sticky", top:0, zIndex:10 }}>
                    <th style={{ width:40, padding:"10px 8px", borderBottom:"2px solid #c9a84c",
                      borderRight:"1px solid #1f2535", color:"#4a4a52", fontSize:10 }}>#</th>
                    {COLS.map(c => (
                      <th key={c.field} style={{ padding:"10px 10px", borderBottom:"2px solid #c9a84c",
                        borderRight:"1px solid #1f2535", textAlign:"left" as const,
                        fontSize:10, fontWeight:700, color:"#c9a84c",
                        textTransform:"uppercase" as const, letterSpacing:"0.1em",
                        whiteSpace:"nowrap" as const, minWidth:c.w }}>
                        {c.label}{c.required && <span style={{ color:"#c97a7a" }}> *</span>}
                      </th>
                    ))}
                    <th style={{ width:50, padding:"10px 8px", borderBottom:"2px solid #c9a84c",
                      color:"#4a4a52", fontSize:10 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => {
                    const rowValid = emp.first_name && emp.last_name && emp.email &&
                                     emp.clearance_type && emp.clearance_request_type;
                    return (
                      <tr key={emp.id}
                        style={{ background:i%2===0?"#111318":"#0f1219",
                          borderBottom:"1px solid #1f2535" }}>
                        {/* Row number */}
                        <td style={{ padding:"6px 8px", borderRight:"1px solid #1f2535",
                          textAlign:"center" as const, color:rowValid?"#5cb87a":"#4a4a52",
                          fontSize:11, fontWeight:700 }}>
                          {rowValid ? "✓" : i+1}
                        </td>
                        {/* Input cells */}
                        {COLS.map(col => (
                          <td key={col.field} style={{ padding:0, borderRight:"1px solid #1f2535" }}>
                            {col.type === "select" ? (
                              <select value={emp[col.field]} onChange={e => update(emp.id, col.field, e.target.value)}
                                style={{ ...cell, borderRadius:0, border:"none",
                                  borderBottom:`2px solid ${emp[col.field]?"#c9a84c":"transparent"}`,
                                  color:emp[col.field]?"#e8e5de":"#4a4a52" }}>
                                <option value="">Select...</option>
                                {(col.field==="clearance_type" ? CLEARANCE_TYPES : REQUEST_TYPES).map(o => (
                                  <option key={o} value={o}>{o}</option>
                                ))}
                              </select>
                            ) : (
                              <input type={col.type} value={emp[col.field]}
                                placeholder={col.placeholder}
                                onChange={e => update(emp.id, col.field, e.target.value)}
                                style={{ ...cell, borderRadius:0, border:"none",
                                  borderBottom:`2px solid ${emp[col.field]?"#c9a84c":"transparent"}` }} />
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
              borderTop:"1px solid #1f2535", flexShrink:0, background:"#111318",
              display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, flexWrap:"wrap" as const }}>
              <div style={{ fontSize:12, color:"#4a4a52" }}>
                {allValid ? `${employees.length} employee${employees.length!==1?"s":""} ready` : "Complete all required fields *"}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setStep("count")}
                  style={{ background:"none", border:"1px solid #1f2535", color:"#7a7a82",
                    padding:"10px 18px", cursor:"pointer", borderRadius:6,
                    fontSize:13, fontFamily:"inherit" }}>← Back</button>
                <button onClick={handleSubmit} disabled={!allValid||submitting}
                  style={{ background:allValid?"#c9a84c":"#2a2a32", border:"none",
                    color:allValid?"#07070a":"#4a4a52",
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
