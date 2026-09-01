import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ enabled: false });

    const { data } = await supabase
      .from("corporate_users")
      .select("totp_enabled")
      .eq("email", email.toLowerCase().trim())
      .single();

    // If user not in corporate_users table, they still authenticated via Supabase Auth
    // but may not have a corporate profile yet — treat as 2FA not set up
    return NextResponse.json({ enabled: data?.totp_enabled || false });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}
