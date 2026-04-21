import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    // Get corporate user record
    const { data: corpUser } = await admin
      .from("corporate_users")
      .select("zoho_account_id, company_name, display_name, role")
      .eq("email", user.email!)
      .single();

    if (!corpUser?.zoho_account_id) {
      return NextResponse.json({ error: "No corporate account found" }, { status: 404 });
    }

    const aid = corpUser.zoho_account_id;

    // Fetch company, personnel, activity in parallel
    const [companyRes, personnelRes, activityRes] = await Promise.all([
      admin.from("corporate_companies")
        .select("*")
        .eq("zoho_account_id", aid)
        .single(),
      admin.from("corporate_personnel")
        .select("*")
        .eq("zoho_account_id", aid)
        .order("employee_name"),
      admin.from("corporate_activity")
        .select("*")
        .eq("zoho_account_id", aid)
        .order("event_date", { ascending: false })
        .limit(20),
    ]);

    return NextResponse.json({
      company: companyRes.data,
      personnel: personnelRes.data || [],
      activity: activityRes.data || [],
      user: {
        email: user.email,
        display_name: corpUser.display_name,
        role: corpUser.role,
      },
    });
  } catch (err) {
    console.error("Dashboard data error:", err);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
