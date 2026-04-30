import { NextResponse } from "next/server";

const CLIENT_ID     = "1000.57XM0OOBWZHPCV60VN2ZEC9AV4P80N";
const CLIENT_SECRET = "c600ba642721a316b6689da2b3c96230ad6463d7ca";
const REFRESH_TOKEN = "1000.cc0c290f4c0aebf03439116960721d2f.ba8c1468f101c30a59fc6be744df8dab";
const TEST_ACCOUNT_ID = "80905000030762144";

async function getFreshAccessToken(): Promise<string> {
  const res = await fetch("https://accounts.zoho.com.au/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
    }).toString(),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Unable to refresh access token");
  return data.access_token;
}

export async function GET() {
  try {
    const token = await getFreshAccessToken();
    const headers = { Authorization: `Zoho-oauthtoken ${token}` };
    const base = "https://www.zohoapis.com.au/crm/v6";

    // Fetch all in parallel
    const [accountRes, dealRes, pipelineRes] = await Promise.all([
      fetch(`${base}/Accounts/${TEST_ACCOUNT_ID}`, { headers }),
      fetch(`${base}/Deals/search?criteria=(Account_Name.id:equals:${TEST_ACCOUNT_ID})AND(Clearance_Type:equals:Corporate Clearance)&fields=Deal_Name,Stage,Amount,Created_Time&per_page=1`, { headers }),
      fetch(`${base}/settings/pipeline?module=Deals`, { headers }),
    ]);

    const [accountData, dealData, pipelineData] = await Promise.all([
      accountRes.json(),
      dealRes.json(),
      pipelineRes.json(),
    ]);

    const account  = accountData.data?.[0];
    if (!account) throw new Error("Account not found");

    const corpDeal = dealData.data?.[0] || null;

    // Extract pipeline stages dynamically from Zoho
    // Find the "Corporate" pipeline (or fall back to first pipeline)
    const pipelines: any[] = pipelineData.pipeline || [];
    const corpPipeline = pipelines.find((p: any) =>
      p.display_value?.toLowerCase().includes("corporate")
    ) || pipelines[0];

    const pipelineStages: string[] = corpPipeline?.maps
      ?.filter((m: any) => m.display_value !== "Closed Won" && m.display_value !== "Closed Lost")
      ?.map((m: any) => m.display_value) || [
        "Onboard Corporate Account",
        "Prepare Contract",
        "Contract Sent",
        "Awaiting Signature",
        "Contracts Signed",
        "Create Invoice",
        "Invoice Sent",
        "Invoice Outstanding",
        "Invoice Paid",
        "Corporate Approved",
    ];

    const nominees: any[] = account.Nominated_Employees || [];

    const company = {
      company_name:           account.Account_Name,
      abn:                    account.ABN_Number,
      account_number:         account.Account_Reference_Number,
      email:                  account.Billing_Email,
      phone:                  account.Account_Phone,
      total_nominees:         Number(account.Total_Nominees)         || 0,
      new_total:              Number(account.New_Total)              || 0,
      upgrade_total:          Number(account.Upgrade_Total)          || 0,
      transfer_total:         Number(account.Transfer_Total)         || 0,
      baseline_total:         Number(account.Baseline_Total)         || 0,
      nv1_total:              Number(account.NV1_Total)              || 0,
      nv2_total:              Number(account.NV2_Total)              || 0,
      total_agsva_fees:       Number(account.Total_AGSVA_Fees)       || 0,
      total_application_fees: Number(account.Total_Application_Fees) || 0,
      total_sponsorship_fees: Number(account.Total_Sponsorship_Fees) || 0,
      total_fees_minus_agsva: Number(account.Total_Fees_Minus_AGSVA) || 0,
      total_fees:             Number(account.Total_Fees)              || 0,
      corp_deal_stage:        corpDeal?.Stage  || "Onboard Corporate Account",
      corp_deal_name:         corpDeal?.Deal_Name || null,
      corp_deal_amount:       corpDeal?.Amount || 0,
      corp_deal_created:      corpDeal?.Created_Time || null,
      pipeline_stages:        pipelineStages,
    };

    const personnel = nominees.map((ne: any) => ({
      id:                     ne.id,
      employee_name:          `${ne.First_Name} ${ne.Last_Name}`.trim(),
      first_name:             ne.First_Name,
      last_name:              ne.Last_Name,
      email:                  ne.Email,
      mobile:                 ne.Mobile,
      clearance_type:         ne.Clearance_Type,
      clearance_request_type: ne.Clearance_Request_Type || "New",
      stage:                  ne.Deal_Stage,
      onboarding_status:      ne.Onboarding_Status,
      batch_date:             ne.Batch_Date,
      linked_deal_name:       ne.Linked_Deal?.name || null,
      employee_number:        ne.Number,
      revalidation_date:      null,
    }));

    const activity = nominees.map((ne: any) => ({
      id:         ne.id + "_act",
      event:      `${ne.First_Name} ${ne.Last_Name} — ${ne.Clearance_Type} sponsorship created`,
      event_date: ne.Batch_Date || account.Created_Time,
    }));

    return NextResponse.json({
      company, personnel, activity,
      user: {
        email:        account.Billing_Email,
        display_name: `${account.Billing_First_Name} ${account.Billing_Last_Name}`,
      },
    });

  } catch (err: any) {
    console.error("Dashboard data error:", err);
    return NextResponse.json({ error: err.message || "Failed to load" }, { status: 500 });
  }
}
