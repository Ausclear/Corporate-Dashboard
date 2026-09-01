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
  const data = await res.json();
  return data.access_token || "";
}

export async function POST(request: Request) {
  try {
    const { account_number, pin } = await request.json();
    if (!account_number || !pin) return NextResponse.json({ error: "Account number and PIN are required" }, { status: 400 });
    if (!/^\d{6}$/.test(pin)) return NextResponse.json({ error: "PIN must be exactly 6 digits" }, { status: 400 });

    const acct = account_number.toUpperCase().trim();

    const existsRes = await fetch(
      `${SUPA_URL}/rest/v1/corporate_users?account_number=eq.${encodeURIComponent(acct)}&select=account_number&limit=1`,
      { headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}` } }
    );
    const existsRows = await existsRes.json();
    if (Array.isArray(existsRows) && existsRows.length > 0) {
      return NextResponse.json({ error: "This account is already registered. Please sign in." }, { status: 409 });
    }

    /* Test account bypass — no Zoho lookup needed */
    const isTest = acct === "TEST" || acct === "TE19166";
    let companyName = "TEST Account";

    if (!isTest) {
      const token = await getZohoToken();
      const searchRes = await fetch(
        `https://www.zohoapis.com.au/crm/v2/Accounts/search?criteria=(Account_Reference_Number:equals:${encodeURIComponent(acct)})`,
        { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
      );
      const searchText = await searchRes.text();
      if (!searchText.trim()) return NextResponse.json({ error: "Account not found. Please check your account number." }, { status: 404 });
      const account = JSON.parse(searchText).data?.[0];
      if (!account) return NextResponse.json({ error: "Account not found. Please check your account number." }, { status: 404 });
      companyName = account.Account_Name;
    }

    const regRes = await fetch(`${SUPA_URL}/rest/v1/rpc/register_corporate_user`, {
      method: "POST",
      headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_account: acct, p_pin: pin, p_company: companyName }),
    });
    const regResult = await regRes.json();

    if (regResult === true) return NextResponse.json({ ok: true, message: "Registration successful. You can now sign in." });
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Registration failed" }, { status: 500 });
  }
}
