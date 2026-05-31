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

const inputBase: React.CSSProperties = {
  background:"#111318", border:"1px solid #1f2535", color:"#e8e5de",
  padding:"12px 14px", fontSize:15, borderRadius:6, outline:"none",
  width:"100%", boxSizing:"border-box",
  fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
};

function Field({ label, value, onChange, type="text", required=false, placeholder="" }:
  { label:string; value:string; onChange:(v:string)=>void; type?:string; required?:boolean; placeholder?:string }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:11, fontWeight:700, color:"#c9a84c", textTransform:"uppercase" as const, letterSpacing:"0.1em" }}>
        {label}{required && <span style={{ color:"#c97a7a" }}> *</span>}
      </label>
      <input type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)} style={inputBase}
        onFocus={e => (e.target as HTMLInputElement).style.borderColor="#c9a84c"}
        onBlur={e  => (e.target as HTMLInputElement).style.borderColor="#1f2535"} />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required=false }:
  { label:string; value:string; onChange:(v:string)=>void; options:string[]; required?:boolean }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:11, fontWeight:700, color:"#c9a84c", textTransform:"uppercase" as const, letterSpacing:"0.1em" }}>
        {label}{required && <span style={{ color:"#c97a7a" }}> *</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inputBase, color:value?"#e8e5de":"#7a7a82", cursor:"pointer" }}
        onFocus={e => (e.target as HTMLSelectElement).style.borderColor="#c9a84c"}
        onBlur={e  => (e.target as HTMLSelectElement).style.borderColor="#1f2535"}>
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

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
        width:"min(680px,96vw)", maxHeight:"90vh",
        background:"#07070a", border:"1px solid #1f2535", borderRadius:8,
        zIndex:201, display:"flex", flexDirection:"column",
        boxShadow:"0 24px 64px rgba(0,0,0,0.8)" };

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", zIndex:200, backdropFilter:"blur(4px)" }} />
      <div style={shell}>

        {/* Top strip / drag handle */}
        {isMobile
          ? <div style={{ display:"flex", justifyContent:"center", padding:"14px 0 6px", flexShrink:0 }}>
              <div style={{ width:36, height:4, borderRadius:2, background:"#2a2a3a" }} />
            </div>
          : <div style={{ height:3, background:"linear-gradient(90deg,#c9a84c,transparent)", borderRadius:"8px 8px 0 0", flexShrink:0 }} />
        }

        {/* Header */}
        <div style={{ padding:isMobile?"8px 20px 14px":"18px 22px 14px",
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
          /* ── STEP 1: count picker ── */
          <div style={{ flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", padding:"32px 24px" }}>
            <div style={{ fontSize:14, color:"#7a7a82", marginBottom:24, textAlign:"center" as const }}>
              Select the number of employees to nominate
            </div>

            {/* Number stepper */}
            <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:40 }}>
              <button
                onClick={() => setCount(c => Math.max(1, c-1))}
                style={{ width:52, height:52, borderRadius:"50%", background:"#161922",
                  border:"1px solid #1f2535", color:"#e8e5de", fontSize:22,
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:"inherit" }}>−</button>
              <div style={{ textAlign:"center" as const }}>
                <div style={{ fontSize:56, fontWeight:700, color:"#c9a84c", lineHeight:1 }}>{count}</div>
                <div style={{ fontSize:12, color:"#7a7a82", marginTop:4 }}>
                  employee{count!==1?"s":""}
                </div>
              </div>
              <button
                onClick={() => setCount(c => Math.min(20, c+1))}
                style={{ width:52, height:52, borderRadius:"50%", background:"#161922",
                  border:"1px solid #1f2535", color:"#e8e5de", fontSize:22,
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:"inherit" }}>+</button>
            </div>

            {/* Quick pick buttons */}
            <div style={{ display:"flex", gap:10, marginBottom:40, flexWrap:"wrap" as const, justifyContent:"center" }}>
              {[1,2,3,5,10].map(n => (
                <button key={n} onClick={() => setCount(n)}
                  style={{ padding:"8px 18px", borderRadius:6, cursor:"pointer", fontSize:13,
                    fontFamily:"inherit", fontWeight:count===n?700:400,
                    background:count===n?"rgba(201,168,76,0.15)":"#161922",
                    border:`1px solid ${count===n?"#c9a84c":"#1f2535"}`,
                    color:count===n?"#c9a84c":"#7a7a82" }}>
                  {n}
                </button>
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
          /* ── STEP 2: employee forms ── */
          <>
            <div style={{ flex:1, overflowY:"auto", padding:isMobile?"14px 16px":"16px 22px",
              display:"flex", flexDirection:"column", gap:14 }}>

              {employees.map((emp, i) => {
                const valid = emp.first_name && emp.last_name && emp.email &&
                              emp.clearance_type && emp.clearance_request_type;
                return (
                  <div key={emp.id} style={{ background:"#161922", border:"1px solid #1f2535",
                    borderRadius:8, overflow:"hidden" }}>
                    <div style={{ padding:"12px 16px", borderBottom:"1px solid #1f2535",
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      background:"#111318" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:26, height:26, borderRadius:"50%",
                          background:"rgba(201,168,76,0.12)", border:"1px solid rgba(201,168,76,0.35)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:11, fontWeight:700, color:"#c9a84c", flexShrink:0 }}>
                          {i+1}
                        </div>
                        <span style={{ fontSize:14, fontWeight:600,
                          color:emp.first_name||emp.last_name?"#e8e5de":"#7a7a82" }}>
                          {emp.first_name||emp.last_name
                            ? `${emp.first_name} ${emp.last_name}`.trim()
                            : "Employee Details"}
                        </span>
                        {valid && <span style={{ fontSize:11, color:"#5cb87a",
                          background:"rgba(92,184,122,0.1)", border:"1px solid rgba(92,184,122,0.3)",
                          padding:"2px 8px", borderRadius:3 }}>✓</span>}
                      </div>
                      {employees.length > 1 && (
                        <button onClick={() => remove(emp.id)}
                          style={{ background:"rgba(201,122,122,0.1)", border:"1px solid rgba(201,122,122,0.3)",
                            color:"#c97a7a", padding:"6px 12px", fontSize:13, cursor:"pointer",
                            borderRadius:4, fontFamily:"inherit" }}>Remove</button>
                      )}
                    </div>
                    <div style={{ padding:16, display:"grid",
                      gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:14 }}>
                      <Field label="First Name" required value={emp.first_name}
                        onChange={v => update(emp.id,"first_name",v)} placeholder="First name" />
                      <Field label="Last Name" required value={emp.last_name}
                        onChange={v => update(emp.id,"last_name",v)} placeholder="Last name" />
                      <Field label="Email" required type="email" value={emp.email}
                        onChange={v => update(emp.id,"email",v)} placeholder="email@company.com" />
                      <Field label="Mobile" value={emp.mobile}
                        onChange={v => update(emp.id,"mobile",v)} placeholder="04xx xxx xxx" />
                      <SelectField label="Clearance Type" required value={emp.clearance_type}
                        onChange={v => update(emp.id,"clearance_type",v)} options={CLEARANCE_TYPES} />
                      <SelectField label="Request Type" required value={emp.clearance_request_type}
                        onChange={v => update(emp.id,"clearance_request_type",v)} options={REQUEST_TYPES} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding:isMobile?"14px 16px":"14px 22px",
              borderTop:"1px solid #1f2535", flexShrink:0, background:"#111318" }}>
              <div style={{ fontSize:12, color:"#4a4a52", marginBottom:10 }}>
                {allValid
                  ? `${employees.length} employee${employees.length!==1?"s":""} ready to submit`
                  : "Complete all required fields *"}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setStep("count")}
                  style={{ flex:1, background:"none", border:"1px solid #1f2535", color:"#7a7a82",
                    padding:14, cursor:"pointer", borderRadius:8, fontSize:15,
                    fontFamily:"inherit", minHeight:50 }}>← Back</button>
                <button onClick={handleSubmit} disabled={!allValid||submitting}
                  style={{ flex:2, background:allValid?"#c9a84c":"#2a2a32", border:"none",
                    color:allValid?"#07070a":"#4a4a52",
                    padding:14, cursor:allValid?"pointer":"not-allowed",
                    borderRadius:8, fontSize:15, fontWeight:700,
                    fontFamily:"inherit", minHeight:50 }}>
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
