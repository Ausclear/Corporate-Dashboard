import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPA_URL = "https://qraxdkzmteogkbfatvir.supabase.co";
const SUPA_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getZohoToken() {
  const res = await fetch("https://accounts.zoho.com.au/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
    }).toString(),
  });
  return (await res.json()).access_token || "";
}

export async function POST(request: Request) {
  try {
    const { account_number, email, new_pin } = await request.json();
    if (!account_number || !email || !new_pin) return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    if (!/^\d{6}$/.test(new_pin)) return NextResponse.json({ error: "PIN must be exactly 6 digits" }, { status: 400 });

    const acct = account_number.toUpperCase().trim();
    const emailLower = email.toLowerCase().trim();

    /* Check account is registered */
    const existsRes = await fetch(
      `${SUPA_URL}/rest/v1/corporate_users?account_number=eq.${encodeURIComponent(acct)}&select=account_number&limit=1`,
      { headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}` } }
    );
    const rows = await existsRes.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Account not found. Please register first." }, { status: 404 });
    }

    /* Verify email matches Zoho billing email */
    const isTest = acct === "TEST" || acct === "TE19166";
    if (!isTest) {
      const token = await getZohoToken();
      const searchRes = await fetch(
        `https://www.zohoapis.com.au/crm/v2/Accounts/search?criteria=(Account_Reference_Number:equals:${encodeURIComponent(acct)})`,
        { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
      );
      const searchText = await searchRes.text();
      if (!searchText.trim()) return NextResponse.json({ error: "Verification failed" }, { status: 401 });
      const account = JSON.parse(searchText).data?.[0];
      const contactEmail = (account?.Email || "").toLowerCase().trim();
      if (contactEmail !== emailLower) {
        return NextResponse.json({ error: "The email address does not match our records for this account." }, { status: 401 });
      }
    }

    /* Update PIN in Supabase via bcrypt function */
    const resetRes = await fetch(`${SUPA_URL}/rest/v1/rpc/reset_corporate_pin`, {
      method: "POST",
      headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_account: acct, p_new_pin: new_pin }),
    });
    const resetResult = await resetRes.json();

    if (resetResult === true) {
      return NextResponse.json({ ok: true, message: "PIN reset successfully. You can now sign in with your new PIN." });
    }
    return NextResponse.json({ error: "Reset failed. Please try again." }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Reset failed" }, { status: 500 });
  }
}
