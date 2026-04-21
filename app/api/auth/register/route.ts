import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, password, company_name } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const em = email.toLowerCase().trim();

    // Check email is on the approved corporate list
    const { data: corpUser } = await supabase
      .from("corporate_users")
      .select("id, company_name, display_name")
      .eq("email", em)
      .single();

    if (!corpUser) {
      return NextResponse.json({
        error: "This email is not associated with a corporate AusClear account. Please contact us on 1300 027 423."
      }, { status: 403 });
    }

    // Create the user via admin API
    // This fires the on_auth_user_created trigger which tries to insert into public.clients.
    // We handle the conflict by making customer_reference NULL (not empty string)
    // so it doesn't hit the unique constraint.
    const { data: authData, error: createErr } = await supabase.auth.admin.createUser({
      email: em,
      password,
      email_confirm: true, // skip email confirmation for corporate accounts
      user_metadata: {
        company_name: corpUser.company_name || company_name || "",
        display_name: corpUser.display_name || "",
        customer_reference: null, // NULL avoids unique constraint on clients table
        full_name: corpUser.display_name || "",
        is_corporate: true,
      },
    });

    if (createErr) {
      if (createErr.message.toLowerCase().includes("already registered") ||
          createErr.message.toLowerCase().includes("already been registered") ||
          createErr.message.includes("already exists")) {
        return NextResponse.json({ error: "An account with this email already exists. Please sign in instead." }, { status: 409 });
      }
      return NextResponse.json({ error: createErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user_id: authData.user?.id });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
