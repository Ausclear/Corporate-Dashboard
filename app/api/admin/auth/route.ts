import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const SUPA_URL = "https://qraxdkzmteogkbfatvir.supabase.co";
const SUPA_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

  if (email.toLowerCase().trim() !== (process.env.ADMIN_EMAIL || "").toLowerCase().trim() ||
      password !== (process.env.ADMIN_PASSWORD || "")) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Generate session token
  const token = crypto.randomUUID();

  // Log admin login
  await fetch(`${SUPA_URL}/rest/v1/admin_audit_log`, {
    method: "POST",
    headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ event_type: "admin_login", details: `Admin login: ${email}` }),
  });

  return NextResponse.json({ ok: true, token });
}
