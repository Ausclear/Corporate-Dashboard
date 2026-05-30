import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CLIENT_ID     = process.env.ZOHO_CLIENT_ID     || "1000.57XM0OOBWZHPCV60VN2ZEC9AV4P80N";
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || "c600ba642721a316b6689da2b3c96230ad6463d7ca";
const REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN || "1000.cc0c290f4c0aebf03439116960721d2f.ba8c1468f101c30a59fc6be744df8dab";
const ACCOUNT_ID    = "80905000030762144"; // NETFLIX — test account

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text || !text.trim()) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

async function getToken(): Promise<string> {
  const res = await fetch("https://accounts.zoho.com.au/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "refresh_token",
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
    }).toString(),
  });
  const data = await safeJson(res);
  if (!data.access_token) throw new Error(`Token failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

export async function GET() {
  try {
    const token = await getToken();
    const h = { Authorization: `Zoho-oauthtoken ${token}` };
    const base = "https://www.zohoapis.com.au/crm/v2";

    const [accountRes, dealsRes] = await Promise.all([
      fetch(`${base}/Accounts/${ACCOUNT_ID}`, { headers: h }),
      fetch(`${base}/Deals/search?criteria=(Account_Name.id:equals:${ACCOUNT_ID})&fields=Deal_Name,Stage,Amount,Created_Time,Clearance_Type&per_page=50`, { headers: h }),
    ]);

    const [accountData, dealsData] = await Promise.all([
      safeJson(accountRes),
      safeJson(dealsRes),
    ]);

    const account = accountData.data?.[0];
    if (!account) throw new Error(`Account not found (status: ${accountRes.status}, data: ${JSON.stringify(accountData).substring(0,200)})`);

    const allDeals: any[] = dealsData.data || [];
    const nominees: any[] = account.Nominated_Employees || [];
    const corpDeals = allDeals.filter((d: any) => d.Clearance_Type === "Corporate Clearance");
    const corpDeal  = corpDeals[0] || null;

    // Group nominees by batch date
    const batchMap: Record<string, any[]> = {};
    nominees.forEach((ne: any) => {
      const k = ne.Batch_Date || "Unknown";
      if (!batchMap[k]) batchMap[k] = [];
      batchMap[k].push(ne);
    });

    const AGSVA: Record<string, number> = {
      "Baseline Security Clearance": 884,
      "NV1 Security Clearance":      1355,
      "NV2 Security Clearance":      2486,
    };
    const APP = 400, SPON = 1460;

    const buildNominee = (ne: any) => ({
      id:                     ne.id,
      employee_name:          `${ne.First_Name || ""} ${ne.Last_Name || ""}`.trim(),
      email:                  ne.Email || "",
      mobile:                 ne.Mobile || "",
      clearance_type:         ne.Clearance_Type || "",
      clearance_request_type: ne.Clearance_Request_Type || "New",
      stage:                  ne.Deal_Stage || "",
      onboarding_status:      ne.Onboarding_Status || "",
      batch_date:             ne.Batch_Date || null,
      linked_deal_name:       ne.Linked_Deal?.name || null,
      employee_number:        ne.Number || null,
      revalidation_date:      null,
    });

    const batches = corpDeals.map((cd: any, idx: number) => {
      const keys  = Object.keys(batchMap).sort();
      const key   = keys[idx] || keys[0] || "Unknown";
      const noms  = batchMap[key] || nominees;
      const agsva = noms.reduce((s: number, n: any) => s + (AGSVA[n.Clearance_Type] || 0), 0);
      const app   = noms.length * APP;
      const spon  = noms.length * SPON;
      return {
        id:             cd.id,
        deal_name:      cd.Deal_Name,
        stage:          cd.Stage,
        amount:         cd.Amount || (agsva + app + spon),
        created_time:   cd.Created_Time,
        batch_date:     key,
        nominee_count:  noms.length,
        baseline_count: noms.filter((n: any) => n.Clearance_Type?.includes("Baseline")).length,
        nv1_count:      noms.filter((n: any) => n.Clearance_Type?.includes("NV1")).length,
        nv2_count:      noms.filter((n: any) => n.Clearance_Type?.includes("NV2")).length,
        upgrade_count:  noms.filter((n: any) => n.Clearance_Request_Type === "Upgrade").length,
        new_count:      noms.filter((n: any) => n.Clearance_Request_Type !== "Upgrade").length,
        agsva_fees:     agsva,
        app_fees:       app,
        sponsor_fees:   spon,
        total_fees:     agsva + app + spon,
        ex_agsva:       app + spon,
        nominees:       noms.map(buildNominee),
      };
    });

    if (batches.length === 0 && nominees.length > 0) {
      const agsva = nominees.reduce((s: number, n: any) => s + (AGSVA[n.Clearance_Type] || 0), 0);
      const app   = nominees.length * APP;
      const spon  = nominees.length * SPON;
      batches.push({
        id: "batch_1", deal_name: `${account.Account_Name} – Batch 1`,
        stage: corpDeal?.Stage || "Onboard Corporate Account",
        amount: agsva + app + spon, created_time: account.Created_Time,
        batch_date: nominees[0]?.Batch_Date || null,
        nominee_count: nominees.length,
        baseline_count: nominees.filter((n: any) => n.Clearance_Type?.includes("Baseline")).length,
        nv1_count:      nominees.filter((n: any) => n.Clearance_Type?.includes("NV1")).length,
        nv2_count:      nominees.filter((n: any) => n.Clearance_Type?.includes("NV2")).length,
        upgrade_count: 0, new_count: nominees.length,
        agsva_fees: agsva, app_fees: app, sponsor_fees: spon,
        total_fees: agsva + app + spon, ex_agsva: app + spon,
        nominees: nominees.map(buildNominee),
      });
    }

    return NextResponse.json({
      company: {
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
        corp_deal_stage:        corpDeal?.Stage   || "Onboard Corporate Account",
        corp_deal_name:         corpDeal?.Deal_Name || null,
        corp_deal_amount:       corpDeal?.Amount   || 0,
        corp_deal_created:      corpDeal?.Created_Time || null,
      },
      personnel: nominees.map(buildNominee),
      activity:  nominees.map((ne: any) => ({
        id:         ne.id + "_act",
        event:      `${ne.First_Name || ""} ${ne.Last_Name || ""} — ${ne.Clearance_Type} sponsorship created`,
        event_date: ne.Batch_Date || account.Created_Time,
      })),
      batches,
      user: { email: account.Billing_Email || "", display_name: account.Account_Name },
    });

  } catch (err: any) {
    console.error("Dashboard error:", err?.message);
    return NextResponse.json({ error: err?.message || "Failed to load" }, { status: 500 });
  }
}
