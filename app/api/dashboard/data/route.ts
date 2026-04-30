import { NextResponse } from "next/server";

const ZOHO_CLIENT_ID     = process.env.ZOHO_CLIENT_ID!;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET!;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN!;
const TEST_ACCOUNT_ID    = "80905000030762144";

async function getZohoToken(): Promise<string> {
  const res = await fetch(
    `https://accounts.zoho.com/oauth/v2/token?refresh_token=${ZOHO_REFRESH_TOKEN}&client_id=${ZOHO_CLIENT_ID}&client_secret=${ZOHO_CLIENT_SECRET}&grant_type=refresh_token`,
    { method: "POST" }
  );
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get Zoho token");
  return data.access_token;
}

async function zohoGet(token: string, url: string) {
  const res = await fetch(url, { headers: { Authorization: `Zoho-oauthtoken ${token}` } });
  return res.json();
}

export async function GET() {
  try {
    const token = await getZohoToken();
    const base  = "https://www.zohoapis.com/crm/v6";

    // Fetch account directly from Zoho
    const accountRes = await zohoGet(token, `${base}/Accounts/${TEST_ACCOUNT_ID}`);
    const account = accountRes.data?.[0];
    if (!account) throw new Error("Account not found");

    // Fetch the corporate deal (Stage) for this account
    const dealsRes = await zohoGet(token,
      `${base}/Deals?fields=Deal_Name,Stage,Amount,Created_Time,Clearance_Type&criteria=(Account_Name.id:equals:${TEST_ACCOUNT_ID})AND(Clearance_Type:equals:Corporate Clearance)&per_page=1`
    );
    const corpDeal = dealsRes.data?.[0] || null;

    // Build company object from Zoho fields
    const company = {
      company_name:           account.Account_Name,
      abn:                    account.ABN_Number,
      account_number:         account.Account_Reference_Number,  // NE88966
      status:                 "Active",
      email:                  account.Billing_Email,
      phone:                  account.Account_Phone,
      total_nominees:         Number(account.Total_Nominees) || 0,
      new_total:              Number(account.New_Total)      || 0,
      upgrade_total:          Number(account.Upgrade_Total)  || 0,
      transfer_total:         Number(account.Transfer_Total) || 0,
      baseline_total:         Number(account.Baseline_Total) || 0,
      nv1_total:              Number(account.NV1_Total)      || 0,
      nv2_total:              Number(account.NV2_Total)      || 0,
      total_agsva_fees:       Number(account.Total_AGSVA_Fees)        || 0,
      total_application_fees: Number(account.Total_Application_Fees)  || 0,
      total_sponsorship_fees: Number(account.Total_Sponsorship_Fees)  || 0,
      total_fees_minus_agsva: Number(account.Total_Fees_Minus_AGSVA)  || 0,
      total_fees:             Number(account.Total_Fees)               || 0,
      corp_deal_stage:        corpDeal?.Stage || "Onboard Corporate Account",
      corp_deal_amount:       corpDeal?.Amount || 0,
    };

    // Build personnel from Nominated_Employees subform
    const nominees: any[] = account.Nominated_Employees || [];
    const personnel = nominees.map((ne: any) => ({
      id:                      ne.id,
      employee_name:           `${ne.First_Name} ${ne.Last_Name}`.trim(),
      first_name:              ne.First_Name,
      last_name:               ne.Last_Name,
      email:                   ne.Email,
      mobile:                  ne.Mobile,
      clearance_type:          ne.Clearance_Type,
      clearance_request_type:  ne.Clearance_Request_Type || "New",
      stage:                   ne.Deal_Stage,
      status:                  ne.Onboarding_Status,
      onboarding_status:       ne.Onboarding_Status,
      batch_date:              ne.Batch_Date,
      linked_deal_name:        ne.Linked_Deal?.name || null,
      employee_number:         ne.Number,
      revalidation_date:       null,
    }));

    // Activity — use Nominated_Employees data to build timeline
    const activity = nominees.map((ne: any) => ({
      id:           ne.id + "_act",
      employee_name:`${ne.First_Name} ${ne.Last_Name}`.trim(),
      event:        `${ne.First_Name} ${ne.Last_Name} — ${ne.Clearance_Type} sponsorship created`,
      event_type:   "sponsorship_created",
      event_date:   ne.Batch_Date || account.Created_Time,
    }));

    return NextResponse.json({
      company,
      personnel,
      activity,
      user: {
        email:        account.Billing_Email,
        display_name: account.Billing_First_Name + " " + account.Billing_Last_Name,
        role:         "admin",
      },
    });
  } catch (err: any) {
    console.error("Dashboard data error:", err);
    return NextResponse.json({ error: err.message || "Failed to load dashboard data" }, { status: 500 });
  }
}
