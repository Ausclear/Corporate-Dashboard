import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const TEST_ACCOUNT_ID = "80905000030762144";

    const [companyRes, personnelRes, activityRes] = await Promise.all([
      admin.from("corporate_companies").select("*").eq("zoho_account_id", TEST_ACCOUNT_ID).single(),
      admin.from("corporate_personnel").select("*").eq("zoho_account_id", TEST_ACCOUNT_ID).order("employee_number"),
      admin.from("corporate_activity").select("*").eq("zoho_account_id", TEST_ACCOUNT_ID).order("event_date", { ascending: false }).limit(20),
    ]);

    return NextResponse.json({
      company: companyRes.data,
      personnel: personnelRes.data || [],
      activity: activityRes.data || [],
      user: {
        email: "mattiascyber@gmail.com",
        display_name: "Mattias CYBER",
        role: "admin",
      },
    });
  } catch (err) {
    console.error("Dashboard data error:", err);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
