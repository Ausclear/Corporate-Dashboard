import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPA_URL = "https://qraxdkzmteogkbfatvir.supabase.co";
const SUPA_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const headers = { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}`, "Content-Type": "application/json" };

export async function GET(req: NextRequest) {
  const acct = req.nextUrl.searchParams.get("account_number")?.toUpperCase().trim();
  if (!acct) return NextResponse.json({ error: "Account required" }, { status: 400 });

  const res = await fetch(
    `${SUPA_URL}/rest/v1/client_messages?client_id=eq.${encodeURIComponent(acct)}&portal_type=eq.corporate&order=created_at.desc&limit=200`,
    { headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}` } }
  );
  const messages = await res.json();
  return NextResponse.json({ messages: Array.isArray(messages) ? messages : [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "send") {
    const { account_number, from_name, subject, message, category, priority, related_employee, thread_id } = body;
    if (!account_number || !message) return NextResponse.json({ error: "Account and message required" }, { status: 400 });

    const payload: any = {
      client_id: account_number.toUpperCase().trim(),
      from_type: "corporate",
      from_name: from_name || "",
      subject: subject || "",
      message,
      category: category || "general",
      priority: priority || "normal",
      related_employee: related_employee || null,
      portal_type: "corporate",
      read_status: false,
    };
    if (thread_id) payload.thread_id = thread_id;

    const res = await fetch(`${SUPA_URL}/rest/v1/client_messages`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (Array.isArray(data) && data[0]) {
      /* Fire Zoho signal for new corporate message */
      try {
        const tokenRes = await fetch("https://accounts.zoho.com.au/oauth/v2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: process.env.ZOHO_CLIENT_ID!,
            client_secret: process.env.ZOHO_CLIENT_SECRET!,
            refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
          }).toString(),
        });
        const { access_token } = await tokenRes.json();
        if (access_token) {
          const acct = account_number.toUpperCase().trim();
          const searchRes = await fetch(
            `https://www.zohoapis.com.au/crm/v2/Contacts/search?criteria=(Account_Name.Account_Reference_Number:equals:${encodeURIComponent(acct)})&per_page=1`,
            { headers: { Authorization: `Zoho-oauthtoken ${access_token}` } }
          );
          const searchText = await searchRes.text();
          const contactId = searchText.trim() ? JSON.parse(searchText).data?.[0]?.id : null;
          if (contactId) {
            await fetch("https://www.zohoapis.com.au/crm/v2/signals/notifications", {
              method: "POST",
              headers: { Authorization: `Zoho-oauthtoken ${access_token}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                signals: [{
                  signal_namespace: "clientcommunications_ausclearclientmessages",
                  subject: `Corporate Message: ${subject || "New message"} — ${acct}`,
                  message: `${from_name || acct} sent a message via Corporate Connect™: ${(message || "").slice(0, 120)}`,
                  id: contactId,
                  actions: [{ type: "link", open_in: "new_tab", display_name: "View in CRM", url: `https://crm.zoho.com.au/crm/org7004248892/tab/Accounts/search/${acct}` }],
                }],
              }),
            });
          }
        }
      } catch { /* signal not critical */ }

      return NextResponse.json({ ok: true, message: data[0] });
    }
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }

  if (action === "mark_read") {
    const { id } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await fetch(`${SUPA_URL}/rest/v1/client_messages?id=eq.${id}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ read_status: true, read_at: new Date().toISOString() }),
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const { id } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await fetch(`${SUPA_URL}/rest/v1/client_messages?id=eq.${id}`, { method: "DELETE", headers });
    await fetch(`${SUPA_URL}/rest/v1/client_messages?thread_id=eq.${id}`, { method: "DELETE", headers });
    return NextResponse.json({ ok: true });
  }

  if (action === "soft_delete") {
    const { id } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await fetch(`${SUPA_URL}/rest/v1/client_messages?id=eq.${id}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ deleted_at: new Date().toISOString() }),
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "restore") {
    const { id } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await fetch(`${SUPA_URL}/rest/v1/client_messages?id=eq.${id}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ deleted_at: null }),
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete_single") {
    const { id } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await fetch(`${SUPA_URL}/rest/v1/client_messages?id=eq.${id}`, { method: "DELETE", headers });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
