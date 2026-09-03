import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const SUPA_URL = "https://qraxdkzmteogkbfatvir.supabase.co";
const SUPA_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supa = (path: string, opts?: RequestInit) =>
  fetch(`${SUPA_URL}/rest/v1/${path}`, {
    ...opts,
    headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}`, "Content-Type": "application/json", ...(opts?.headers || {}) },
  });

export async function GET() {
  try {
    const [usersRes, cacheRes, auditRes, settingsRes] = await Promise.all([
      supa("corporate_users?select=account_number,company_name,last_login&order=last_login.desc.nullslast"),
      supa("corporate_dashboard_cache?select=account_number,data,updated_at"),
      supa("admin_audit_log?select=*&order=created_at.desc&limit=100"),
      supa("portal_settings?select=*"),
    ]);

    const [users, cache, audit, settings] = await Promise.all([
      usersRes.json(), cacheRes.json(), auditRes.json(), settingsRes.json(),
    ]);

    // Merge cache data into users
    const cacheMap: Record<string, any> = {};
    if (Array.isArray(cache)) cache.forEach((c: any) => { cacheMap[c.account_number] = c; });

    const accounts = (Array.isArray(users) ? users : []).map((u: any) => {
      const c = cacheMap[u.account_number]?.data?.company || {};
      return {
        account_number: u.account_number,
        company_name: u.company_name || c.company_name || "—",
        last_login: u.last_login,
        auth_contact: [c.auth_first_name, c.auth_last_name].filter(Boolean).join(" ") || "—",
        auth_email: c.auth_email || c.email || "—",
        total_nominees: c.total_nominees || 0,
        total_fees: c.total_fees || 0,
        corp_stage: c.corp_deal_stage || "—",
        cached_at: cacheMap[u.account_number]?.updated_at || null,
      };
    });

    const settingsMap: Record<string, string> = {};
    if (Array.isArray(settings)) settings.forEach((s: any) => { settingsMap[s.key] = s.value; });

    return NextResponse.json({ accounts, audit: Array.isArray(audit) ? audit : [], settings: settingsMap });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { action, key, value, account_number, details } = await req.json();

  if (action === "update_setting") {
    await supa(`portal_settings?key=eq.${encodeURIComponent(key)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" } as any,
      body: JSON.stringify({ value, updated_at: new Date().toISOString() }),
    });
    await supa("admin_audit_log", {
      method: "POST",
      headers: { Prefer: "return=minimal" } as any,
      body: JSON.stringify({ event_type: "setting_changed", details: `${key} → ${value}` }),
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "log_event") {
    await supa("admin_audit_log", {
      method: "POST",
      headers: { Prefer: "return=minimal" } as any,
      body: JSON.stringify({ event_type: details, account_number }),
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
