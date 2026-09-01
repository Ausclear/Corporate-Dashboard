"use client";
import React, { useState, useEffect, useCallback } from "react";

type Msg = {
  id: string; client_id: string; from_type: string; from_name: string;
  subject: string; message: string; category: string; priority: string;
  created_at: string; read_status: boolean; thread_id: string | null;
  related_employee: string | null; attachments: any[]; deleted_at?: string | null;
};

type Theme = { bg:string; card:string; card2:string; line:string; gold:string; goldD:string;
  text:string; muted:string; dim:string; green:string; blue:string; amber:string; red:string; topbar:string; };

const CATS = ["General enquiry","Billing","Clearance query","Nomination support","Account update","Urgent"];

export default function MessagesTab({ accountNumber, companyName, contactName, personnel, C, isDark }:
  { accountNumber: string; companyName: string; contactName: string; personnel: { employee_name: string; clearance_type: string }[]; C: Theme; isDark: boolean }) {

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"inbox"|"thread"|"compose">("inbox");
  const [filter, setFilter] = useState<"all"|"unread"|"sent"|"bin">("all");
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("General enquiry");
  const [priority, setPriority] = useState("normal");
  const [relEmployee, setRelEmployee] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/messages?account_number=${encodeURIComponent(accountNumber)}`);
      const data = await res.json();
      setMsgs(data.messages || []);
    } catch {} finally { setLoading(false); }
  }, [accountNumber]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  /* Group messages into threads */
  const threads = React.useMemo(() => {
    const active = msgs.filter(m => !m.deleted_at);
    const roots = active.filter(m => !m.thread_id);
    const replies = active.filter(m => m.thread_id);
    return roots.map(root => ({
      ...root,
      replies: replies.filter(r => r.thread_id === root.id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      replyCount: replies.filter(r => r.thread_id === root.id).length,
      lastActivity: replies.filter(r => r.thread_id === root.id).reduce((latest, r) => new Date(r.created_at) > new Date(latest) ? r.created_at : latest, root.created_at),
      hasUnread: [root, ...replies.filter(r => r.thread_id === root.id)].some(m => m.from_type === "admin" && !m.read_status),
    })).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }, [msgs]);

  const filtered = filter === "bin"
    ? msgs.filter(m => m.deleted_at).map(m => ({ ...m, replies: [], replyCount: 0, lastActivity: m.created_at, hasUnread: false }))
    : threads.filter(t => {
      if (filter === "unread") return t.hasUnread;
      if (filter === "sent") return t.from_type === "corporate";
      return true;
    });

  const unreadCount = threads.filter(t => t.hasUnread).length;

  const fmtDate = (s: string) => { try { const d = new Date(s); return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }); } catch { return s; } };
  const fmtTime = (s: string) => { try { const d = new Date(s); return `${d.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}, ${d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}`; } catch { return s; } };

  const catCol = (cat: string) => {
    if (cat?.includes("Billing")) return C.green;
    if (cat?.includes("Clearance")) return C.amber;
    if (cat?.includes("Urgent")) return C.red;
    if (cat?.includes("Nomination")) return C.blue;
    if (cat?.includes("Account")) return C.gold;
    return C.muted;
  };

  const sendMessage = async (threadId?: string) => {
    if (!body.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/dashboard/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send", account_number: accountNumber, from_name: contactName || companyName,
          subject: threadId ? undefined : subject, message: body.trim(),
          category, priority, related_employee: relEmployee || null, thread_id: threadId || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(threadId ? "Reply sent successfully" : "Message sent successfully");
        setSent(true);
        setBody(""); setSubject(""); setRelEmployee("");
        await loadMessages();
        setTimeout(() => { setSent(false); if (!threadId) setView("inbox"); }, 1500);
      }
    } catch {} finally { setSending(false); }
  };

  const markRead = async (id: string) => {
    await fetch("/api/dashboard/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", id }),
    });
    setMsgs(prev => prev.map(m => m.id === id ? { ...m, read_status: true } : m));
  };

  const deleteMsg = async (id: string) => {
    await fetch("/api/dashboard/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "soft_delete", id }),
    });
    setMsgs(prev => prev.map(m => m.id === id ? { ...m, deleted_at: new Date().toISOString() } : m));
    setConfirmId(null);
    showToast("Moved to bin");
  };

  const restoreMsg = async (id: string) => {
    await fetch("/api/dashboard/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore", id }),
    });
    setMsgs(prev => prev.map(m => m.id === id ? { ...m, deleted_at: null } : m));
    showToast("Message restored");
  };

  const openThread = (t: typeof threads[0]) => {
    setActiveThread(t.id);
    setView("thread");
    if (t.from_type === "admin" && !t.read_status) markRead(t.id);
    t.replies.filter(r => r.from_type === "admin" && !r.read_status).forEach(r => markRead(r.id));
  };

  const S = {
    card: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" as const, boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)" },
    hdr: { padding: "16px 20px", borderBottom: `1px solid ${C.line}`, display: "flex" as const, justifyContent: "space-between" as const, alignItems: "center" as const, background: isDark ? "rgba(201,168,76,0.03)" : "rgba(37,99,176,0.02)" },
    btn: (active: boolean) => ({ padding: "6px 16px", border: `1px solid ${active ? C.gold : C.line}`, background: active ? C.goldD : "transparent", color: active ? C.gold : C.muted, fontSize: 12, cursor: "pointer" as const, borderRadius: 8, fontWeight: active ? 700 : 400 as any, transition: "all 0.15s" }),
    input: { width: "100%", padding: "11px 14px", background: isDark ? C.bg : "#fff", border: `1px solid ${C.line}`, borderRadius: 8, color: C.text, WebkitTextFillColor: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" as const, opacity: 1, transition: "border-color 0.15s" },
    label: { display: "block" as const, fontSize: 11, color: C.muted, marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: "0.1em", fontWeight: 600 as any },
    sendBtn: (enabled: boolean) => ({ padding: "11px 28px", background: enabled ? C.gold : C.line, border: "none", borderRadius: 8, color: enabled ? (isDark ? "#07070a" : "#fff") : C.dim, fontSize: 13, fontWeight: 700 as any, cursor: enabled ? "pointer" : "not-allowed" as any, transition: "all 0.2s", boxShadow: enabled ? `0 2px 8px ${C.gold}33` : "none" }),
  };

  /* Toast notification */
  const Toast = ({ msg, type }: { msg: string; type: "success" | "error" }) => (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 999, padding: "14px 24px", borderRadius: 10,
      background: type === "success" ? (isDark ? "#1a3a2a" : "#e8f8ee") : (isDark ? "#3a1a1a" : "#f8e8e8"),
      border: `1px solid ${type === "success" ? C.green + "44" : C.red + "44"}`,
      color: type === "success" ? C.green : C.red,
      fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
      boxShadow: "0 8px 32px rgba(0,0,0,0.15)", animation: "slideIn 0.3s ease",
    }}>
      <span style={{ fontSize: 18 }}>{type === "success" ? "✓" : "✗"}</span> {msg}
    </div>
  );

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
    <div style={{ width: 24, height: 24, border: `2px solid ${C.line}`, borderTopColor: C.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
    Loading messages...
    <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>
  </div>;

  const ToastEl = toast ? <div style={{ position:"fixed", top:24, right:24, zIndex:999, padding:"12px 20px", borderRadius:10, background:isDark?"#1a3a2a":"#e8f8ee", border:`1px solid ${C.green}44`, color:C.green, fontSize:13, fontWeight:600, boxShadow:"0 8px 32px rgba(0,0,0,0.15)", animation:"slideIn 0.3s ease", display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:18 }}>✓</span> {toast}</div> : null;
  const AnimCSS = <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>;

  /* ═══ COMPOSE ═══ */
  if (view === "compose") return (
    <>{ToastEl}{AnimCSS}
    <div style={{ maxWidth: 640 }}>
      <div style={S.card}>
        <div style={S.hdr}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setView("inbox")} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontSize: 16 }}>←</button>
            <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>New message</span>
          </div>
        </div>
        <div style={{ padding: 18, display: "flex", flexDirection: "column" as const, gap: 14 }}>
          <div>
            <label style={S.label}>Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description of your enquiry" style={S.input} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...S.input, color: C.text, WebkitTextFillColor: C.text, backgroundColor: C.bg }}>
                {CATS.map(c => <option key={c} value={c} style={{ color:"#1a1a2e", backgroundColor:"#fff" }}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} style={{ ...S.input, color: C.text, WebkitTextFillColor: C.text, backgroundColor: C.bg }}>
                <option value="normal" style={{ color:"#1a1a2e", backgroundColor:"#fff" }}>Normal</option>
                <option value="high" style={{ color:"#1a1a2e", backgroundColor:"#fff" }}>High</option>
                <option value="urgent" style={{ color:"#1a1a2e", backgroundColor:"#fff" }}>Urgent</option>
              </select>
            </div>
          </div>
          {personnel.length > 0 && (
            <div>
              <label style={S.label}>Related employee (optional)</label>
              <select value={relEmployee} onChange={e => setRelEmployee(e.target.value)} style={{ ...S.input, color: C.text, WebkitTextFillColor: C.text, backgroundColor: C.bg }}>
                <option value="" style={{ color:"#1a1a2e", backgroundColor:"#fff" }}>None</option>
                {personnel.map(p => <option key={p.employee_name} value={p.employee_name} style={{ color:"#1a1a2e", backgroundColor:"#fff" }}>{p.employee_name} — {p.clearance_type}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={S.label}>Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Type your message..." rows={5}
              style={{ ...S.input, resize: "vertical" as const, fontFamily: "inherit" }} />
          </div>
          {sent && <div style={{ color: C.green, fontSize: 12, fontWeight: 600 }}>Message sent successfully</div>}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => sendMessage()} disabled={!subject.trim() || !body.trim() || sending}
              style={S.sendBtn(!!subject.trim() && !!body.trim())}>
              {sending ? "Sending..." : "Send message"}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );

  /* ═══ THREAD VIEW ═══ */
  if (view === "thread" && activeThread) {
    const thread = threads.find(t => t.id === activeThread);
    if (!thread) { setView("inbox"); return null; }
    const allMsgs = [thread, ...thread.replies];
    return (
      <>{ToastEl}{AnimCSS}
      <div style={{ maxWidth: 640 }}>
        <div style={S.card}>
          <div style={{ ...S.hdr, flexDirection: "column" as const, alignItems: "flex-start" as const, gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
              <button onClick={() => setView("inbox")} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontSize: 16 }}>←</button>
              <span style={{ fontWeight: 600, fontSize: 14, color: C.text, flex: 1 }}>{thread.subject || "No subject"}</span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: `${catCol(thread.category)}15`, color: catCol(thread.category), fontWeight: 600, border: `1px solid ${catCol(thread.category)}33` }}>{thread.category || "General"}</span>
            </div>
            <div style={{ fontSize: 11, color: C.dim, display: "flex", gap: 10, paddingLeft: 24, alignItems: "center" }}>
              {thread.related_employee && <span>Employee: {thread.related_employee}</span>}
              <span>{fmtDate(thread.created_at)}</span>
              <span>{thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}</span>
              <span style={{ marginLeft: "auto" }} />
            </div>
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column" as const, gap: 12 }}>
            {allMsgs.map(m => {
              const isAdmin = m.from_type === "admin";
              const senderName = m.from_name || (isAdmin ? "AusClear Team" : companyName);
              const initials = isAdmin ? "AC" : senderName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              const isUnread = isAdmin && !m.read_status;
              return (
                <div key={m.id} style={{ background: isAdmin ? (isDark ? "#0d1830" : "#eef4ff") : (isDark ? "#1a1810" : "#faf8f0"), border: `1px solid ${isAdmin ? (isDark ? "#1a2a4a" : "#d0dff4") : (isDark ? "#2a2818" : "#ede8d8")}`, borderRadius: 8, padding: 14, borderLeft: isUnread ? `3px solid ${C.blue}` : undefined }}>
                  {confirmId === m.id && (
                    <div style={{ background: isDark ? "#2a1010" : "#fef2f2", border: `1px solid ${C.red}33`, borderRadius: 6, padding: "10px 14px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: C.red }}>Delete this message?</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setConfirmId(null)} style={{ padding: "4px 12px", border: `1px solid ${C.line}`, background: "transparent", borderRadius: 4, fontSize: 11, cursor: "pointer", color: C.muted }}>Cancel</button>
                        <button onClick={() => { deleteMsg(m.id); setConfirmId(null); }} style={{ padding: "4px 12px", border: "none", background: C.red, borderRadius: 4, fontSize: 11, cursor: "pointer", color: "#fff", fontWeight: 600 }}>Delete</button>
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: isAdmin ? C.blue + "22" : C.gold + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: isAdmin ? C.blue : C.gold }}>{initials}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{senderName}{isUnread && <span style={{ marginLeft: 6, fontSize: 9, background: C.blue, color: "#fff", padding: "1px 6px", borderRadius: 8, fontWeight: 700 }}>NEW</span>}</div>
                        <div style={{ fontSize: 10, color: C.dim }}>{isAdmin ? "AusClear" : companyName}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, color: C.dim }}>{fmtTime(m.created_at)}</span>
                      {isUnread && <button onClick={(e) => { e.stopPropagation(); markRead(m.id); showToast("Marked as read"); }} style={{ padding: "2px 6px", border: `1px solid ${C.line}`, background: "transparent", color: C.muted, fontSize: 10, cursor: "pointer", borderRadius: 4 }} title="Mark as read">✓</button>}
                      <button onClick={(e) => { e.stopPropagation(); setConfirmId(m.id); }} style={{ padding: "2px 6px", border: "none", background: "transparent", color: C.red, fontSize: 12, cursor: "pointer", borderRadius: 4, opacity: 0.7 }} title="Delete">🗑</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: C.text, whiteSpace: "pre-wrap" as const }}>{m.message}</div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>Reply to this thread</div>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Type your reply..." rows={3}
              style={{ ...S.input, resize: "vertical" as const, fontFamily: "inherit", marginBottom: 8 }} />
            {sent && <div style={{ color: C.green, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Reply sent</div>}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => sendMessage(thread.id)} disabled={!body.trim() || sending}
                style={S.sendBtn(!!body.trim())}>
                {sending ? "Sending..." : "Send reply"}
              </button>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  /* ═══ INBOX ═══ */
  return (
    <>{ToastEl}{AnimCSS}
    <div style={{ maxWidth: 640 }}>
      <div style={S.card}>
        <div style={S.hdr}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>Secure message board</span>
            {unreadCount > 0 && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: C.blue + "22", color: C.blue, fontWeight: 600 }}>{unreadCount} new</span>}
          </div>
          <button onClick={() => { setView("compose"); setSent(false); setSubject(""); setBody(""); setCategory("General enquiry"); setPriority("normal"); setRelEmployee(""); }}
            style={{ padding: "7px 14px", background: C.gold, border: "none", borderRadius: 6, color: isDark ? "#07070a" : "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + Compose
          </button>
        </div>
        <div style={{ display: "flex", gap: 4, padding: "10px 18px", borderBottom: `1px solid ${C.line}` }}>
          {(["all", "unread", "sent", "bin"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={S.btn(filter === f)}>{f === "all" ? "All" : f === "unread" ? "Unread" : f === "sent" ? "Sent" : "🗑 Bin"}</button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" as const, color: C.dim }}>
            {filter === "all" ? "No messages yet. Send your first message to AusClear." : `No ${filter} messages.`}
          </div>
        ) : filtered.map(t => (
          <div key={t.id} onClick={() => openThread(t)}
            style={{ padding: "14px 18px", borderBottom: `1px solid ${C.line}`, cursor: "pointer", background: t.hasUnread ? (isDark ? C.blue + "08" : C.blue + "06") : "transparent" }}
            onMouseEnter={e => (e.currentTarget.style.background = C.card2)}
            onMouseLeave={e => (e.currentTarget.style.background = t.hasUnread ? (isDark ? C.blue + "08" : C.blue + "06") : "transparent")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {t.hasUnread && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.blue, flexShrink: 0 }} />}
                {!t.hasUnread && <div style={{ width: 8, height: 8, borderRadius: "50%", border: `1px solid ${C.dim}`, flexShrink: 0 }} />}
                <span style={{ fontWeight: t.hasUnread ? 600 : 400, fontSize: 13, color: t.hasUnread ? C.text : C.muted }}>{t.from_type === "admin" ? "AusClear Team" : contactName || companyName}</span>
                <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: `${catCol(t.category)}12`, color: catCol(t.category), fontWeight: 600, border: `1px solid ${catCol(t.category)}30` }}>{t.category || "General"}</span>
              </div>
              <span style={{ fontSize: 11, color: C.dim }}>{fmtDate(t.lastActivity)}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: t.hasUnread ? 600 : 400, color: t.hasUnread ? C.text : C.muted, marginBottom: 4, paddingLeft: 14 }}>{t.subject || "No subject"}</div>
            <div style={{ fontSize: 12, color: C.dim, paddingLeft: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{t.message}</div>
            {(t.replyCount > 0 || t.related_employee || filter === "bin") && (
              <div style={{ display: "flex", gap: 10, paddingLeft: 14, marginTop: 4, alignItems: "center" }}>
                {t.replyCount > 0 && <span style={{ fontSize: 10, color: C.dim }}>{t.replyCount} {t.replyCount === 1 ? "reply" : "replies"}</span>}
                {t.related_employee && <span style={{ fontSize: 10, color: C.dim }}>Employee: {t.related_employee}</span>}
                {filter === "bin" && <button onClick={(e) => { e.stopPropagation(); restoreMsg(t.id); }} style={{ marginLeft: "auto", padding: "3px 10px", border: `1px solid ${C.green}44`, background: "transparent", borderRadius: 4, color: C.green, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>↩ Restore</button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
