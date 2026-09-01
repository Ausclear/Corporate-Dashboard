import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Get corporate user record
    const { data: corpUser } = await adminSupabase
      .from("corporate_users")
      .select("email, zoho_account_id, company_name, display_name, role, totp_enabled, last_login")
      .eq("email", user.email.toLowerCase())
      .single();

    if (!corpUser) {
      return NextResponse.json({ authenticated: false, error: "Not a corporate user" }, { status: 403 });
    }

    return NextResponse.json({
      authenticated: true,
      user: corpUser,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
