import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const em = email.toLowerCase().trim();

    // Check email is on the approved corporate list
    const { data: corpUser } = await supabase
      .from("corporate_users")
      .select("id, company_name, display_name, totp_enabled")
      .eq("email", em)
      .single();

    if (!corpUser) {
      return NextResponse.json({
        error: "This email is not associated with a corporate AusClear account. Please contact us on 1300 027 423."
      }, { status: 403 });
    }

    // Check if user already exists in auth
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existing = users.find(u => u.email === em);

    if (existing) {
      // Account exists — check if 2FA is set up
      if (!corpUser.totp_enabled) {
        // Account created but 2FA never completed — send them to login which handles setup
        return NextResponse.json({
          error: "An account with this email already exists but 2FA setup is incomplete. Please sign in to complete setup.",
          redirect_to_login: true
        }, { status: 409 });
      }
      return NextResponse.json({
        error: "An account with this email already exists. Please sign in instead.",
        redirect_to_login: true
      }, { status: 409 });
    }

    // Create the user via admin API — sets is_corporate: true so the trigger skips clients table
    const { data: authData, error: createErr } = await supabase.auth.admin.createUser({
      email: em,
      password,
      email_confirm: false, // require email OTP confirmation
      user_metadata: {
        company_name: corpUser.company_name || "",
        display_name: corpUser.display_name || "",
        customer_reference: null,
        full_name: corpUser.display_name || "",
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
