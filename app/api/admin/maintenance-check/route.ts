import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const SUPA_URL = "https://qraxdkzmteogkbfatvir.supabase.co";
const SUPA_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const [modeRes, msgRes] = await Promise.all([
      fetch(`${SUPA_URL}/rest/v1/portal_settings?key=eq.maintenance_mode&select=value&limit=1`,
        { headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}` } }),
      fetch(`${SUPA_URL}/rest/v1/portal_settings?key=eq.maintenance_message&select=value&limit=1`,
        { headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}` } }),
    ]);
    const modeRows = await modeRes.json();
    const msgRows = await msgRes.json();
    const active = Array.isArray(modeRows) && modeRows[0]?.value === "true";
    const message = (Array.isArray(msgRows) && msgRows[0]?.value) || "The portal is currently undergoing scheduled maintenance.";
    return NextResponse.json({ active, message });
  } catch {
    return NextResponse.json({ active: false, message: "" });
  }
}
