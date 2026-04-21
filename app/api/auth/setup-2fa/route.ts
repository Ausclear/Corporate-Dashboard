import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const { data: user } = await supabase
      .from("corporate_users")
      .select("id, company_name, totp_secret, totp_enabled")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // If already has a secret but not enabled, reuse it. Otherwise generate new.
    let secret: string;
    if (user.totp_secret && !user.totp_enabled) {
      secret = user.totp_secret;
    } else if (user.totp_enabled) {
      return NextResponse.json({ error: "2FA already enabled", enabled: true }, { status: 400 });
    } else {
      const totp = new OTPAuth.TOTP({
        issuer: "AusClear Corporate",
        label: email.toLowerCase().trim(),
        algorithm: "SHA1",
        digits: 6,
        period: 30,
      });
      secret = totp.secret.base32;

      // Store secret (not yet enabled)
      await supabase
        .from("corporate_users")
        .update({ totp_secret: secret })
        .eq("id", user.id);
    }

    // Generate QR code
    const totp = new OTPAuth.TOTP({
      issuer: "AusClear Corporate",
      label: email.toLowerCase().trim(),
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    const uri = totp.toString();
    const qrDataUrl = await QRCode.toDataURL(uri, {
      width: 280,
      margin: 2,
      color: { dark: "#e8e6e1", light: "#202028" },
    });

    return NextResponse.json({ qr: qrDataUrl, secret });
  } catch (err) {
    console.error("Setup 2FA error:", err);
    return NextResponse.json({ error: "Failed to set up 2FA" }, { status: 500 });
  }
}
