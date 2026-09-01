import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPA_URL = "https://qraxdkzmteogkbfatvir.supabase.co";
const SUPA_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { account_number, contact_name, pin } = await request.json();
    if (!account_number || !contact_name || !pin) return NextResponse.json({ error: "All fields are required" }, { status: 400 });

    const acct = account_number.toUpperCase().trim();
    const name = contact_name.trim().toLowerCase();

    /* 1. Validate contact name against Supabase cache */
    const cacheRes = await fetch(
      `${SUPA_URL}/rest/v1/corporate_dashboard_cache?account_number=eq.${encodeURIComponent(acct)}&select=data&limit=1`,
      { headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}` } }
    );
    const cacheRows = await cacheRes.json();

    if (Array.isArray(cacheRows) && cacheRows.length > 0 && cacheRows[0].data?.company) {
      const co = cacheRows[0].data.company;
      const authName = `${co.auth_first_name || ""} ${co.auth_last_name || ""}`.trim().toLowerCase();
      if (authName && name !== authName) {
        return NextResponse.json({ error: "Account not found" }, { status: 401 });
      }
    }
    /* If no cache exists, skip name check — PIN still validates */

    /* 2. Verify PIN via Supabase function */
    const verifyRes = await fetch(`${SUPA_URL}/rest/v1/rpc/verify_corporate_pin`, {
      method: "POST",
      headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_account: acct, p_pin: pin }),
    });
    const valid = await verifyRes.json();

    if (valid !== true) {
      return NextResponse.json({ error: "Invalid account number or PIN" }, { status: 401 });
    }

    /* Update last login */
    await fetch(`${SUPA_URL}/rest/v1/corporate_users?account_number=eq.${encodeURIComponent(acct)}`, {
      method: "PATCH",
      headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}`, "Content-Type": "application/json" },
      body: JSON.stringify({ last_login: new Date().toISOString() }),
    });

    return NextResponse.json({ ok: true, account_number: acct });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Login failed" }, { status: 500 });
  }
}
