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
      supa("corporate_users?select=account_number,company_name,last_login,status,registered_at&order=last_login.desc.nullslast"),
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
        status: u.status || "approved",
        registered_at: u.registered_at,
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

  if (action === "set_status") {
    await supa(`corporate_users?account_number=eq.${encodeURIComponent(account_number)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" } as any,
      body: JSON.stringify({ status: value }),
    });
    await supa("admin_audit_log", {
      method: "POST",
      headers: { Prefer: "return=minimal" } as any,
      body: JSON.stringify({ event_type: "status_changed", account_number, details: `Account ${account_number} → ${value}` }),
    });

    /* Send approval email via ZeptoMail when approving */
    if (value === "approved") {
      try {
        // Get contact details from cache
        const cacheRes = await supa(`corporate_dashboard_cache?account_number=eq.${encodeURIComponent(account_number)}&select=data&limit=1`);
        const cacheRows = await cacheRes.json();
        const co = (Array.isArray(cacheRows) && cacheRows[0]?.data?.company) || {};
        const contactEmail = co.auth_email || co.email || "";
        const contactFirst = co.auth_first_name || "";
        const contactFull = [co.auth_first_name, co.auth_last_name].filter(Boolean).join(" ");
        const companyName = co.company_name || "";

        if (contactEmail) {
          const zeptoToken = process.env.ZEPTO_SEND_TOKEN || "Zoho-enczapikey GkDdjPjZ+AIYlQiUrI67N4cEb8lm5ZvnGJqzM5lVoRMsvtsK5EwefZRMliN6ymJM6neXDFbNdOB39TLb57zYenJ7fnyvLETuOpwzGB+edd0FvHvXUPi+8/ZkXEvLmPCqMw1v6BU18i0q";
          const templateKey = process.env.ZEPTO_APPROVAL_TEMPLATE || "7a6803.e20d1d341f34b53.k1.7afbf7d0-a758-11f1-abd8-6aade8430e9a.1a065bea7cd";

          await fetch("https://api.zeptomail.com.au/v1.1/email/template", {
            method: "POST",
            headers: { Authorization: zeptoToken, "Content-Type": "application/json" },
            body: JSON.stringify({
              template_key: templateKey,
              from: { address: "support@ausclear.com.au", name: "AusClear Corporate Connect" },
              to: [{ email_address: { address: contactEmail, name: contactFull || contactEmail } }],
              merge_info: {
                name: contactFirst || contactFull,
                company: companyName,
                account_number: account_number,
                contact_name: contactFull,
              },
            }),
          });

          await supa("admin_audit_log", {
            method: "POST",
            headers: { Prefer: "return=minimal" } as any,
            body: JSON.stringify({ event_type: "approval_email", account_number, details: `Approval email sent to ${contactEmail}` }),
          });
        }
      } catch { /* email send failed — approval still stands */ }
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "deactivate") {
    // Set status to deactivated
    await supa(`corporate_users?account_number=eq.${encodeURIComponent(account_number)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" } as any,
      body: JSON.stringify({ status: "deactivated" }),
    });
    await supa("admin_audit_log", {
      method: "POST",
      headers: { Prefer: "return=minimal" } as any,
      body: JSON.stringify({ event_type: "account_deactivated", account_number, details: `Account ${account_number} deactivated: ${value}` }),
    });

    // Send deactivation email via ZeptoMail
    try {
      const cacheRes = await supa(`corporate_dashboard_cache?account_number=eq.${encodeURIComponent(account_number)}&select=data&limit=1`);
      const cacheRows = await cacheRes.json();
      const co = (Array.isArray(cacheRows) && cacheRows[0]?.data?.company) || {};
      const contactEmail = co.auth_email || co.email || "";
      const contactFirst = co.auth_first_name || "";
      const contactFull = [co.auth_first_name, co.auth_last_name].filter(Boolean).join(" ");
      const companyName = co.company_name || "";

      if (contactEmail) {
        const zeptoToken = process.env.ZEPTO_SEND_TOKEN || "Zoho-enczapikey GkDdjPjZ+AIYlQiUrI67N4cEb8lm5ZvnGJqzM5lVoRMsvtsK5EwefZRMliN6ymJM6neXDFbNdOB39TLb57zYenJ7fnyvLETuOpwzGB+edd0FvHvXUPi+8/ZkXEvLmPCqMw1v6BU18i0q";
        const templateKey = process.env.ZEPTO_DEACTIVATION_TEMPLATE || "7a6803.e20d1d341f34b53.k1.fd6715d0-a75b-11f1-abd8-6aade8430e9a.1a065d5a7ad";

        await fetch("https://api.zeptomail.com.au/v1.1/email/template", {
          method: "POST",
          headers: { Authorization: zeptoToken, "Content-Type": "application/json" },
          body: JSON.stringify({
            template_key: templateKey,
            from: { address: "support@ausclear.com.au", name: "AusClear Corporate Connect" },
            to: [{ email_address: { address: contactEmail, name: contactFull || contactEmail } }],
            merge_info: {
              name: contactFirst || contactFull,
              company: companyName,
              account_number: account_number,
              reason: value,
            },
          }),
        });

        await supa("admin_audit_log", {
          method: "POST",
          headers: { Prefer: "return=minimal" } as any,
          body: JSON.stringify({ event_type: "deactivation_email", account_number, details: `Deactivation email sent to ${contactEmail}` }),
        });
      }
    } catch {}

    return NextResponse.json({ ok: true });
  }

  if (action === "reset_pin") {
    const { new_pin } = await req.json().catch(() => ({ new_pin: null }));
    const pinVal = value || new_pin;
    if (!pinVal || !/^\d{6}$/.test(pinVal)) return NextResponse.json({ error: "PIN must be 6 digits" }, { status: 400 });
    const SUPA_SRK2 = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const resetRes = await fetch(`${SUPA_URL}/rest/v1/rpc/reset_corporate_pin`, {
      method: "POST",
      headers: { apikey: SUPA_SRK2, Authorization: `Bearer ${SUPA_SRK2}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_account: account_number, p_new_pin: pinVal }),
    });
    const result = await resetRes.json();
    if (result === true) {
      await supa("admin_audit_log", {
        method: "POST",
        headers: { Prefer: "return=minimal" } as any,
        body: JSON.stringify({ event_type: "pin_reset", account_number, details: `Admin reset PIN for ${account_number}` }),
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "PIN reset failed" }, { status: 500 });
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
