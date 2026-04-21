import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as OTPAuth from "otpauth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) return NextResponse.json({ valid: false, error: "Email and code required" });

    const { data: user } = await supabase
      .from("corporate_users")
      .select("id, totp_secret, totp_enabled, zoho_account_id, company_name, display_name")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!user || !user.totp_secret) {
      return NextResponse.json({ valid: false, error: "2FA not configured for this account." });
    }

    const totp = new OTPAuth.TOTP({
      issuer: "AusClear Corporate",
      label: email.toLowerCase().trim(),
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.totp_secret),
    });

    const delta = totp.validate({ token: code, window: 1 });

    if (delta === null) {
      return NextResponse.json({ valid: false, error: "Invalid code. Please try again." });
    }

    // Enable 2FA on first successful verification
    if (!user.totp_enabled) {
      await supabase.from("corporate_users").update({ totp_enabled: true }).eq("id", user.id);
    }

    // Update last login timestamp
    await supabase.from("corporate_users").update({ last_login: new Date().toISOString() }).eq("id", user.id);

    return NextResponse.json({
      valid: true,
      user: {
        email: email.toLowerCase().trim(),
        zoho_account_id: user.zoho_account_id,
        company_name: user.company_name,
        display_name: user.display_name,
      },
    });
  } catch (err) {
    console.error("Verify 2FA error:", err);
    return NextResponse.json({ valid: false, error: "Verification failed" });
  }
}
