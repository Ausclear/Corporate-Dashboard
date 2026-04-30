import { NextResponse } from "next/server";

const CLIENT_ID     = "1000.57XM0OOBWZHPCV60VN2ZEC9AV4P80N";
const CLIENT_SECRET = "c600ba642721a316b6689da2b3c96230ad6463d7ca";
const REFRESH_TOKEN = "1000.cc0c290f4c0aebf03439116960721d2f.ba8c1468f101c30a59fc6be744df8dab";
const TEST_ACCOUNT_ID = "80905000010862243"; // Adept CONTRACTS

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
    const h = { Authorization: `Zoho-oauthtoken ${token}` };
    const base = "https://www.zohoapis.com.au/crm/v6";

    // Fetch account and all deals in parallel
    const [accountRes, allDealsRes] = await Promise.all([
      fetch(`${base}/Accounts/${TEST_ACCOUNT_ID}`, { headers: h }),
      fetch(`${base}/Deals/search?criteria=(Account_Name.id:equals:${TEST_ACCOUNT_ID})&fields=Deal_Name,Stage,Amount,Created_Time,Clearance_Type,Clearance_Request_Type&per_page=50`, { headers: h }),
    ]);

    const [accountData, allDealsData] = await Promise.all([
      accountRes.json(),
      allDealsRes.json(),
    ]);

    const account = accountData.data?.[0];
    if (!account) throw new Error("Account not found");

    const allDeals: any[] = allDealsData.data || [];
    const nominees: any[] = account.Nominated_Employees || [];

    // Split corporate batch deals from individual employee deals
    const corpDeals = allDeals.filter((d: any) => d.Clearance_Type === "Corporate Clearance");
    const empDeals  = allDeals.filter((d: any) => d.Clearance_Type !== "Corporate Clearance");

    // Primary corp deal (for pipeline stage)
    const corpDeal = corpDeals[0] || null;

    // Group nominees by batch_date to form batches
    const batchMap: Record<string, any[]> = {};
    nominees.forEach((ne: any) => {
      const key = ne.Batch_Date || "Unknown";
      if (!batchMap[key]) batchMap[key] = [];
      batchMap[key].push(ne);
    });

    // Build fee rates
    const AGSVA_FEES: Record<string, number> = {
      "Baseline Security Clearance": 884,
      "NV1 Security Clearance": 1355,
      "NV2 Security Clearance": 2486,
    };
    const APP_FEE = 400;
    const SPONSORSHIP_FEE = 1460;

    // Build batches — one per corp deal, nominees grouped by batch date
    const batches = corpDeals.map((cd: any, idx: number) => {
      const batchKeys = Object.keys(batchMap).sort();
      const batchKey  = batchKeys[idx] || batchKeys[0] || "Unknown";
      const batchNoms = batchMap[batchKey] || nominees; // fallback to all nominees

      const baselineCount = batchNoms.filter((n: any) => n.Clearance_Type?.includes("Baseline")).length;
      const nv1Count      = batchNoms.filter((n: any) => n.Clearance_Type?.includes("NV1")).length;
      const nv2Count      = batchNoms.filter((n: any) => n.Clearance_Type?.includes("NV2")).length;
      const upgradeCount  = batchNoms.filter((n: any) => n.Clearance_Request_Type === "Upgrade").length;
      const newCount      = batchNoms.filter((n: any) => n.Clearance_Request_Type !== "Upgrade").length;

      // Calculate batch financials
      const agsvaFees    = batchNoms.reduce((s: number, n: any) => s + (AGSVA_FEES[n.Clearance_Type] || 0), 0);
      const appFees      = batchNoms.length * APP_FEE;
      const sponsorFees  = batchNoms.length * SPONSORSHIP_FEE;
      const totalFees    = agsvaFees + appFees + sponsorFees;
      const exAgsva      = appFees + sponsorFees;

      return {
        id:              cd.id,
        deal_name:       cd.Deal_Name,
        stage:           cd.Stage,
        amount:          cd.Amount || totalFees,
        created_time:    cd.Created_Time,
        batch_date:      batchKey,
        nominee_count:   batchNoms.length,
        baseline_count:  baselineCount,
        nv1_count:       nv1Count,
        nv2_count:       nv2Count,
        upgrade_count:   upgradeCount,
        new_count:       newCount,
        agsva_fees:      agsvaFees,
        app_fees:        appFees,
        sponsor_fees:    sponsorFees,
        total_fees:      totalFees,
        ex_agsva:        exAgsva,
        nominees: batchNoms.map((ne: any) => ({
          id:                     ne.id,
          employee_name:          `${ne.First_Name} ${ne.Last_Name}`.trim(),
          email:                  ne.Email,
          mobile:                 ne.Mobile,
          clearance_type:         ne.Clearance_Type,
          clearance_request_type: ne.Clearance_Request_Type || "New",
          stage:                  ne.Deal_Stage,
          onboarding_status:      ne.Onboarding_Status,
          batch_date:             ne.Batch_Date,
          linked_deal_name:       ne.Linked_Deal?.name || null,
          employee_number:        ne.Number,
        })),
      };
    });

    // If no corp deals, create synthetic batch
    if (batches.length === 0 && nominees.length > 0) {
      const agsvaFees   = nominees.reduce((s: number, n: any) => s + (AGSVA_FEES[n.Clearance_Type] || 0), 0);
      const appFees     = nominees.length * APP_FEE;
      const sponsorFees = nominees.length * SPONSORSHIP_FEE;
      batches.push({
        id: "batch_1", deal_name: `${account.Account_Name} – Batch 1`,
        stage: "Onboard Corporate Account", amount: agsvaFees + appFees + sponsorFees,
        created_time: account.Created_Time, batch_date: nominees[0]?.Batch_Date || null,
        nominee_count: nominees.length,
        baseline_count: nominees.filter((n: any) => n.Clearance_Type?.includes("Baseline")).length,
        nv1_count: nominees.filter((n: any) => n.Clearance_Type?.includes("NV1")).length,
        nv2_count: nominees.filter((n: any) => n.Clearance_Type?.includes("NV2")).length,
        upgrade_count: 0, new_count: nominees.length,
        agsva_fees: agsvaFees, app_fees: appFees, sponsor_fees: sponsorFees,
        total_fees: agsvaFees + appFees + sponsorFees, ex_agsva: appFees + sponsorFees,
        nominees: nominees.map((ne: any) => ({
          id: ne.id, employee_name: `${ne.First_Name} ${ne.Last_Name}`.trim(),
          email: ne.Email, mobile: ne.Mobile, clearance_type: ne.Clearance_Type,
          clearance_request_type: ne.Clearance_Request_Type || "New",
          stage: ne.Deal_Stage, onboarding_status: ne.Onboarding_Status,
          batch_date: ne.Batch_Date, linked_deal_name: ne.Linked_Deal?.name || null,
          employee_number: ne.Number,
        })),
      });
    }

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
      company, personnel, activity, batches,
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
