import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const SUPA_URL = "https://qraxdkzmteogkbfatvir.supabase.co";
const SUPA_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/portal_settings?select=key,value`,
      { headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}` } });
    const rows = await res.json();
    const settings: Record<string, string> = {};
    if (Array.isArray(rows)) rows.forEach((r: any) => { settings[r.key] = r.value; });

    return NextResponse.json({
      active: settings.maintenance_mode === "true",
      message: settings.maintenance_message || "The portal is currently undergoing scheduled maintenance.",
      banner: settings.notification_banner_active === "true" ? {
        text: settings.notification_banner || "",
        type: settings.notification_banner_type || "info",
      } : null,
    });
  } catch {
    return NextResponse.json({ active: false, message: "", banner: null });
  }
}
