"use client";
import React, { useState } from "react";

const C = {
  bg:    "#07070a",
  card:  "#111318",
  card2: "#161922",
  line:  "#1f2535",
  gold:  "#c9a84c",
  goldD: "rgba(201,168,76,0.12)",
  goldB: "rgba(201,168,76,0.35)",
  text:  "#e8e5de",
  muted: "#7a7a82",
  dim:   "#4a4a52",
  green: "#5cb87a",
  red:   "#c97a7a",
  redD:  "rgba(201,122,122,0.12)",
  redB:  "rgba(201,122,122,0.35)",
};

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  clearance_type: string;
  clearance_request_type: string;
};

const CLEARANCE_TYPES = [
  "Baseline Security Clearance",
  "NV1 Security Clearance",
  "NV2 Security Clearance",
];
const REQUEST_TYPES = ["New", "Upgrade", "Transfer"];

function blank(): Employee {
  return { id: Math.random().toString(36).slice(2), first_name: "", last_name: "",
    email: "", mobile: "", clearance_type: "", clearance_request_type: "New" };
}

const inputStyle = {
  background: "#111318", border: "1px solid #1f2535", color: "#e8e5de",
  padding: "9px 12px", fontSize: 13, borderRadius: 4, outline: "none", width: "100%",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  boxSizing: "border-box" as const,
};

function Field({ label, value, onChange, type = "text", required = false, placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: "#c9a84c",
        textTransform: "uppercase" as const, letterSpacing: "0.12em" }}>
        {label}{required && <span style={{ color: "#c97a7a" }}> *</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={inputStyle}
        onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#c9a84c"}
        onBlur={e  => (e.target as HTMLInputElement).style.borderColor = "#1f2535"} />
    </div>
  );
}

function Select({ label, value, onChange, options, required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; required?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: "#c9a84c",
        textTransform: "uppercase" as const, letterSpacing: "0.12em" }}>
        {label}{required && <span style={{ color: "#c97a7a" }}> *</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, cursor: "pointer", color: value ? "#e8e5de" : "#7a7a82" }}
        onFocus={e => (e.target as HTMLSelectElement).style.borderColor = "#c9a84c"}
        onBlur={e  => (e.target as HTMLSelectElement).style.borderColor = "#1f2535"}>
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function NominateModal({ onClose, onSubmit }: {
  onClose: () => void; onSubmit?: (employees: Employee[]) => void;
}) {
  const [employees, setEmployees] = useState<Employee[]>([blank()]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (id: string, field: keyof Employee, value: string) =>
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));

  const remove = (id: string) => setEmployees(prev => prev.filter(e => e.id !== id));

  const allValid = employees.every(e =>
    e.first_name && e.last_name && e.email && e.clearance_type && e.clearance_request_type
  );

  const handleSubmit = async () => {
    if (!allValid) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    setSubmitted(true);
    setSubmitting(false);
    if (onSubmit) onSubmit(employees);
  };

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)",
        zIndex:200, backdropFilter:"blur(4px)" }} />
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        zIndex:201, width:"min(700px,96vw)", maxHeight:"90vh",
        display:"flex", flexDirection:"column",
        background:"#07070a", border:"1px solid #1f2535", borderRadius:8,
        boxShadow:"0 24px 64px rgba(0,0,0,0.8)" }}>

        {/* Gold strip */}
        <div style={{ height:3, background:"linear-gradient(90deg,#c9a84c,transparent)",
          borderRadius:"8px 8px 0 0", flexShrink:0 }} />

        {/* Header */}
        <div style={{ padding:"18px 22px 14px", borderBottom:"1px solid #1f2535",
          display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:"#e8e5de" }}>Nominate Employees</div>
            <div style={{ fontSize:12, color:"#7a7a82", marginTop:3 }}>
              {employees.length} employee{employees.length !== 1 ? "s" : ""} · all required fields marked *
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"1px solid #1f2535",
            color:"#7a7a82", padding:"6px 12px", cursor:"pointer", borderRadius:4,
            fontSize:13, fontFamily:"inherit" }}>✕</button>
        </div>

        {submitted ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", padding:40 }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(92,184,122,0.12)",
              border:"1px solid rgba(92,184,122,0.35)", display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:24, marginBottom:16 }}>✓</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#5cb87a", marginBottom:8 }}>Nomination Submitted</div>
            <div style={{ fontSize:13, color:"#7a7a82", textAlign:"center" as const }}>
              {employees.length} employee{employees.length !== 1 ? "s" : ""} have been nominated.
            </div>
            <button onClick={onClose} style={{ marginTop:24, background:"#c9a84c", border:"none",
              padding:"10px 28px", color:"#07070a", fontWeight:700, cursor:"pointer",
              borderRadius:4, fontSize:13, fontFamily:"inherit" }}>Done</button>
          </div>
        ) : (
          <>
            {/* Employee list */}
            <div style={{ flex:1, overflowY:"auto", padding:"16px 22px",
              display:"flex", flexDirection:"column", gap:12 }}>
              {employees.map((emp, i) => {
                const valid = emp.first_name && emp.last_name && emp.email && emp.clearance_type && emp.clearance_request_type;
                return (
                  <div key={emp.id} style={{ background:"#161922", border:"1px solid #1f2535", borderRadius:6, overflow:"hidden" }}>
                    {/* Row header */}
                    <div style={{ padding:"10px 14px", borderBottom:"1px solid #1f2535",
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      background:"#111318" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:22, height:22, borderRadius:"50%",
                          background:"rgba(201,168,76,0.12)", border:"1px solid rgba(201,168,76,0.35)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:10, fontWeight:700, color:"#c9a84c", flexShrink:0 }}>
                          {i + 1}
                        </div>
                        <span style={{ fontSize:13, fontWeight:600,
                          color:emp.first_name || emp.last_name ? "#e8e5de" : "#7a7a82" }}>
                          {emp.first_name || emp.last_name
                            ? `${emp.first_name} ${emp.last_name}`.trim()
                            : "New Employee"}
                        </span>
                        {valid && <span style={{ fontSize:10, color:"#5cb87a",
                          background:"rgba(92,184,122,0.1)", border:"1px solid rgba(92,184,122,0.3)",
                          padding:"1px 7px", borderRadius:3 }}>✓ Ready</span>}
                      </div>
                      {employees.length > 1 && (
                        <button onClick={() => remove(emp.id)}
                          style={{ background:"rgba(201,122,122,0.1)", border:"1px solid rgba(201,122,122,0.3)",
                            color:"#c97a7a", padding:"4px 10px", fontSize:11,
                            cursor:"pointer", borderRadius:3, fontFamily:"inherit" }}>
                          Remove
                        </button>
                      )}
                    </div>
                    {/* Fields */}
                    <div style={{ padding:"14px", display:"grid",
                      gridTemplateColumns:"1fr 1fr", gap:"12px 16px" }}>
                      <Field label="First Name" required value={emp.first_name}
                        onChange={v => update(emp.id, "first_name", v)} placeholder="First name" />
                      <Field label="Last Name" required value={emp.last_name}
                        onChange={v => update(emp.id, "last_name", v)} placeholder="Last name" />
                      <Field label="Email" required type="email" value={emp.email}
                        onChange={v => update(emp.id, "email", v)} placeholder="email@company.com" />
                      <Field label="Mobile" value={emp.mobile}
                        onChange={v => update(emp.id, "mobile", v)} placeholder="04xx xxx xxx" />
                      <Select label="Clearance Type" required value={emp.clearance_type}
                        onChange={v => update(emp.id, "clearance_type", v)} options={CLEARANCE_TYPES} />
                      <Select label="Request Type" required value={emp.clearance_request_type}
                        onChange={v => update(emp.id, "clearance_request_type", v)} options={REQUEST_TYPES} />
                    </div>
                  </div>
                );
              })}

              {/* Add another */}
              <button onClick={() => setEmployees(p => [...p, blank()])}
                style={{ background:"none", border:"1px dashed #1f2535", color:"#7a7a82",
                  padding:"12px", cursor:"pointer", borderRadius:6, fontSize:13,
                  fontFamily:"inherit", textAlign:"center" as const }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#c9a84c";
                  (e.currentTarget as HTMLButtonElement).style.color = "#c9a84c";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#1f2535";
                  (e.currentTarget as HTMLButtonElement).style.color = "#7a7a82";
                }}>
                + Add Another Employee
              </button>
            </div>

            {/* Footer */}
            <div style={{ padding:"14px 22px", borderTop:"1px solid #1f2535",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              flexShrink:0, background:"#111318" }}>
              <div style={{ fontSize:11, color:"#4a4a52" }}>
                {allValid
                  ? `${employees.length} employee${employees.length !== 1 ? "s" : ""} ready`
                  : "Complete all required fields *"}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={onClose}
                  style={{ background:"none", border:"1px solid #1f2535", color:"#7a7a82",
                    padding:"9px 20px", cursor:"pointer", borderRadius:4,
                    fontSize:13, fontFamily:"inherit" }}>
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={!allValid || submitting}
                  style={{ background:allValid ? "#c9a84c" : "#2a2a32", border:"none",
                    color:allValid ? "#07070a" : "#4a4a52",
                    padding:"9px 24px", cursor:allValid ? "pointer" : "not-allowed",
                    borderRadius:4, fontSize:13, fontWeight:700, fontFamily:"inherit" }}>
                  {submitting ? "Submitting..." : `Submit ${employees.length > 1 ? employees.length + " Employees" : "Employee"}`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
