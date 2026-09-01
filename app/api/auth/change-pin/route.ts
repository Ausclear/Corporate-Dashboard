import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPA_URL = "https://qraxdkzmteogkbfatvir.supabase.co";
const SUPA_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { account_number, current_pin, new_pin } = await request.json();
    if (!account_number || !current_pin || !new_pin) return NextResponse.json({ error: "All fields required" }, { status: 400 });
    if (!/^\d{6}$/.test(new_pin)) return NextResponse.json({ error: "New PIN must be exactly 6 digits" }, { status: 400 });
    if (current_pin === new_pin) return NextResponse.json({ error: "New PIN must be different from current PIN" }, { status: 400 });

    const acct = account_number.toUpperCase().trim();

    /* Verify current PIN */
    const verifyRes = await fetch(`${SUPA_URL}/rest/v1/rpc/verify_corporate_pin`, {
      method: "POST",
      headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_account: acct, p_pin: current_pin }),
    });
    if ((await verifyRes.json()) !== true) {
      return NextResponse.json({ error: "Current PIN is incorrect" }, { status: 401 });
    }

    /* Set new PIN */
    const resetRes = await fetch(`${SUPA_URL}/rest/v1/rpc/reset_corporate_pin`, {
      method: "POST",
      headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_account: acct, p_new_pin: new_pin }),
    });
    if ((await resetRes.json()) !== true) {
      return NextResponse.json({ error: "Failed to update PIN" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "PIN changed successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}
