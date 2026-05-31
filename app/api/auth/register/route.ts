import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ZOHO_CLIENT_ID     = process.env.ZOHO_CLIENT_ID     || "";
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || "";
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN || "";

async function getZohoToken(): Promise<string> {
  const res = await fetch("https://accounts.zoho.com.au/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token", client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET, refresh_token: ZOHO_REFRESH_TOKEN,
    }).toString(),
  });
  const d = await res.json();
  if (!d.access_token) throw new Error("Zoho token failed");
  return d.access_token;
}

async function lookupZohoAccount(accountNumber: string): Promise<{ id: string; name: string } | null> {
  try {
    const token = await getZohoToken();
    const res = await fetch(
      `https://www.zohoapis.com.au/crm/v2/Accounts/search?criteria=(Account_Reference_Number:equals:${encodeURIComponent(accountNumber)})&fields=Account_Name,Account_Reference_Number`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    );
    const text = await res.text();
    if (!text.trim()) return null;
    const data = JSON.parse(text);
    const acct = data.data?.[0];
    if (!acct) return null;
    return { id: acct.id, name: acct.Account_Name };
  } catch { return null; }
}

export async function POST(req: Request) {
  try {
    const { email, password, account_number } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    if (!account_number) {
      return NextResponse.json({ error: "Account number is required" }, { status: 400 });
    }

    const em = email.toLowerCase().trim();
    const acctNum = account_number.toUpperCase().trim();

    // Validate account number against Zoho
    const zohoAcct = await lookupZohoAccount(acctNum);
    if (!zohoAcct) {
      return NextResponse.json({
        error: "Invalid account number. Please check and try again, or contact us on 1300 027 423."
      }, { status: 400 });
    }

    // Check if corporate_users entry exists for this email
    const { data: corpUser } = await supabase
      .from("corporate_users")
      .select("id, company_name, display_name, totp_enabled")
      .eq("email", em)
      .single();

    if (corpUser) {
      // Existing approved user — update their zoho_account_id
      await supabase
        .from("corporate_users")
        .update({ zoho_account_id: zohoAcct.id, account_number: acctNum, company_name: zohoAcct.name })
        .eq("email", em);
    } else {
      // Create new corporate_users entry
      const { error: insertErr } = await supabase
        .from("corporate_users")
        .insert({
          email: em,
          zoho_account_id: zohoAcct.id,
          account_number: acctNum,
          company_name: zohoAcct.name,
          display_name: em.split("@")[0],
          role: "user",
          totp_enabled: false,
        });
      if (insertErr) {
        console.error("Insert corporate_users error:", insertErr);
        return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
      }
    }

    // Re-fetch the corporate user for metadata
    const { data: updatedCorpUser } = await supabase
      .from("corporate_users")
      .select("id, company_name, display_name, totp_enabled")
      .eq("email", em)
      .single();

    if (!updatedCorpUser) {
      return NextResponse.json({ error: "Registration failed." }, { status: 500 });
    }

    // Check if user already exists in auth
    const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = users.find((u: { email?: string }) => u.email === em);

    if (existing) {
      if (existing.email_confirmed_at && updatedCorpUser.totp_enabled) {
        return NextResponse.json({
          error: "An account with this email already exists. Please sign in instead.",
          redirect_to_login: true
        }, { status: 409 });
      }
      await supabase.auth.admin.deleteUser(existing.id);
    }

    // Reset 2FA
    await supabase
      .from("corporate_users")
      .update({ totp_enabled: false, totp_secret: null })
      .eq("email", em);

    // Create auth user
    const { data: authData, error: createErr } = await supabase.auth.admin.createUser({
      email: em,
      password,
      email_confirm: false,
      user_metadata: {
        company_name: zohoAcct.name,
        display_name: updatedCorpUser.display_name || "",
        account_number: acctNum,
        zoho_account_id: zohoAcct.id,
        full_name: updatedCorpUser.display_name || "",
        is_corporate: true,
      },
    });

    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user_id: authData.user?.id });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
