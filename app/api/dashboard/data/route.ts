import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CLIENT_ID     = process.env.ZOHO_CLIENT_ID     || "";
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || "";
const REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN || "";

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountNumber = searchParams.get("account_number");

    if (!accountNumber) {
      return NextResponse.json({ error: "Account number is required" }, { status: 400 });
    }

    const token = await getToken();
    const h = { Authorization: `Zoho-oauthtoken ${token}` };
    const base = "https://www.zohoapis.com.au/crm/v2";

    /* ── Look up account by Account_Reference_Number ── */
    const searchRes = await fetch(
      `${base}/Accounts/search?criteria=(Account_Reference_Number:equals:${encodeURIComponent(accountNumber.toUpperCase().trim())})`,
      { headers: h }
    );
    const searchData = await safeJson(searchRes);
    const searchResult = searchData.data?.[0];

    if (!searchResult) {
      return NextResponse.json({ error: "Invalid account number. Please check and try again." }, { status: 404 });
    }

    const ACCOUNT_ID = searchResult.id;

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

    /* ── Fetch Leads matching this company ── */
    const companyName = account.Account_Name || "";
    let leadRecords: any[] = [];
    if (companyName) {
      try {
        const leadsRes = await fetch(
          `${base}/Leads/search?criteria=(Company:equals:${encodeURIComponent(companyName)})&fields=First_Name,Last_Name,Email,Company,Lead_Status&per_page=100`,
          { headers: h }
        );
        const leadsData = await safeJson(leadsRes);
        leadRecords = leadsData.data || [];
      } catch { /* leads search failed — continue without */ }
    }

    /* Build a lead lookup by normalised email and name */
    const leadByEmail: Record<string, any> = {};
    const leadByName: Record<string, any> = {};
    leadRecords.forEach((ld: any) => {
      if (ld.Email) leadByEmail[ld.Email.toLowerCase().trim()] = ld;
      const fullName = `${ld.First_Name || ""} ${ld.Last_Name || ""}`.trim().toLowerCase();
      if (fullName) leadByName[fullName] = ld;
    });;

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

    const buildNominee = (ne: any) => {
      const stage = ne.Deal_Stage || "";

      /* If no deal stage, check if this nominee exists as a lead — flag on onboarding_status */
      let onboardStatus = ne.Onboarding_Status || "";
      if (!stage) {
        const email = (ne.Email || "").toLowerCase().trim();
        const name  = `${ne.First_Name || ""} ${ne.Last_Name || ""}`.trim().toLowerCase();
        const isLead = (email && leadByEmail[email]) || (name && leadByName[name]);
        if (isLead) onboardStatus = "Awaiting Application Form";
      }

      return {
        id:                     ne.id,
        employee_name:          `${ne.First_Name || ""} ${ne.Last_Name || ""}`.trim(),
        email:                  ne.Email || "",
        mobile:                 ne.Mobile || "",
        clearance_type:         ne.Clearance_Type || "",
        clearance_request_type: ne.Clearance_Request_Type || "New",
        stage,
        onboarding_status:      onboardStatus,
        batch_date:             ne.Batch_Date || null,
        linked_deal_name:       ne.Linked_Deal?.name || null,
        employee_number:        ne.Number || null,
        revalidation_date:      null,
      };
    };

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
