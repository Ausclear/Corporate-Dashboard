import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ authorised: false });

    const { data } = await supabase
      .from("corporate_users")
      .select("id, company_name, display_name, zoho_account_id")
      .eq("email", email.toLowerCase().trim())
      .single();

    return NextResponse.json({
      authorised: !!data,
      company_name: data?.company_name || null,
      display_name: data?.display_name || null,
    });
  } catch {
    return NextResponse.json({ authorised: false });
  }
}
