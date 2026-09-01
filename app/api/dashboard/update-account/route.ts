import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPA_URL = "https://qraxdkzmteogkbfatvir.supabase.co";
const SUPA_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/* Only these Zoho fields can be updated by corporate clients */
const ALLOWED_FIELDS: Record<string, string> = {
  company_name:       "Account_Name",
  website:            "Website",
  industry:           "Industry",
  phone:              "Account_Phone",
  billing_first_name: "Billing_First_Name",
  billing_last_name:  "Billing_Last_Name",
  billing_email:      "Billing_Email",
  billing_phone:      "Billing_Phone",
  billing_job_title:  "Billing_Job_Title",
  billing_street:     "Billing_Street",
  billing_suburb:     "Suburb",
  billing_state:      "Billing_State",
  billing_postcode:   "Post_code",
  billing_country:    "Billing_Country",
  auth_first_name:    "Authorised_Contact_First_Name",
  auth_last_name:     "Authorised_Contact_Last_Name",
  auth_email:         "Authoriser_Email",
  auth_phone:         "Authoriser_Phone",
  auth_job_title:     "Authoriser_Job_Title",
  purchase_order:     "Purchase_Order_Number",
};

async function getToken() {
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
    const { account_number, updates } = await request.json();
    if (!account_number || !updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Account number and updates required" }, { status: 400 });
    }

    const acct = account_number.toUpperCase().trim();
    const token = await getToken();
    const base = "https://www.zohoapis.com.au/crm/v2";

    /* Look up account */
    const searchRes = await fetch(
      `${base}/Accounts/search?criteria=(Account_Reference_Number:equals:${encodeURIComponent(acct)})`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    );
    const searchText = await searchRes.text();
    if (!searchText.trim()) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    const account = JSON.parse(searchText).data?.[0];
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    /* Map allowed fields only */
    const zohoUpdate: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      const zohoField = ALLOWED_FIELDS[key];
      if (zohoField && value !== undefined) {
        zohoUpdate[zohoField] = value;
      }
    }

    if (Object.keys(zohoUpdate).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    /* Update Zoho */
    const updateRes = await fetch(`${base}/Accounts/${account.id}`, {
      method: "PUT",
      headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ data: [{ id: account.id, ...zohoUpdate }] }),
    });
    const updateData = await updateRes.json();

    if (updateData.data?.[0]?.code !== "SUCCESS") {
      return NextResponse.json({ error: updateData.data?.[0]?.message || "Update failed" }, { status: 500 });
    }

    /* Invalidate Supabase cache so next load fetches fresh from Zoho */
    try {
      await fetch(`${SUPA_URL}/rest/v1/corporate_dashboard_cache?account_number=eq.${encodeURIComponent(acct)}`, {
        method: "DELETE",
        headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}` },
      });
    } catch { /* cache invalidation not critical */ }

    return NextResponse.json({ ok: true, message: "Account updated successfully", fields_updated: Object.keys(zohoUpdate).length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Update failed" }, { status: 500 });
  }
}
