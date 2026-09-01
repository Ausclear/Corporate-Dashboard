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

    const upperAcct = accountNumber.toUpperCase().trim();

    /* ═══ CACHE — serve if fresh (< 5 min), otherwise fetch from Zoho ═══ */
    const SUPA_URL = "https://qraxdkzmteogkbfatvir.supabase.co";
    const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (upperAcct !== "TEST" && upperAcct !== "TE19166") {
      try {
        const cacheRes = await fetch(
          `${SUPA_URL}/rest/v1/corporate_dashboard_cache?account_number=eq.${encodeURIComponent(upperAcct)}&select=data,updated_at&limit=1`,
          { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } }
        );
        const cacheRows = await cacheRes.json();
        if (Array.isArray(cacheRows) && cacheRows.length > 0 && cacheRows[0].data) {
          const age = Date.now() - new Date(cacheRows[0].updated_at).getTime();
          if (age < 5 * 60 * 1000) {
            const cached = cacheRows[0].data;
            cached._cached = true;
            cached._cached_at = cacheRows[0].updated_at;
            return NextResponse.json(cached);
          }
        }
      } catch { /* cache miss — fall through to Zoho */ }
    }

    /* ═══ TEST MODE — pure mock data, zero API calls ═══ */
    if (upperAcct === "TEST" || upperAcct === "TE19166") {
      const mockPersonnel = [
        { id:"1", employee_name:"Carl BUGENHAGEN", email:"carl@test.com", mobile:"0400000001", clearance_type:"NV1", clearance_request_type:"New", stage:"AGSVA Clearance Pending", onboarding_status:"", batch_date:"2025-11", linked_deal_name:"Carl BUGENHAGEN NV1", employee_number:1, revalidation_date:null },
        { id:"2", employee_name:"Mattias BRADMAN", email:"mattias@test.com", mobile:"0400000002", clearance_type:"NV1", clearance_request_type:"Upgrade", stage:"ESC Pending", onboarding_status:"", batch_date:"2025-11", linked_deal_name:"Mattias BRADMAN NV1", employee_number:2, revalidation_date:null },
      ];
      const mockBatch = {
        id:"batch_1", deal_name:"TEST – Batch 1", stage:"Corporate Approved",
        amount:6504, created_time:"2025-11-01T00:00:00+10:30", batch_date:"2025-11",
        nominee_count:2, baseline_count:0, nv1_count:2, nv2_count:0,
        upgrade_count:1, new_count:1,
        agsva_fees:1897, app_fees:770, sponsor_fees:2800,
        total_fees:5467, ex_agsva:3570,
        promotional_offer: null, discount: 0,
        nominees: mockPersonnel,
      };
      return NextResponse.json({
        company: {
          company_name:"TEST", abn:"00 000 000 000", account_number:"TE19166",
          email:"test@test.com", phone:"0000000000",
          total_nominees:2, new_total:1, upgrade_total:1, transfer_total:0,
          baseline_total:0, nv1_total:2, nv2_total:0,
          total_agsva_fees:1897, total_application_fees:770, total_sponsorship_fees:2800,
          total_fees_minus_agsva:3570, total_fees:5467,
          corp_deal_stage:"Corporate Approved",
          corp_deal_name:"TEST Corporate Clearance", corp_deal_amount:6430, corp_deal_created:"2025-11-01",
        },
        personnel: mockPersonnel,
        activity: [
          { id:"a1", event:"Carl BUGENHAGEN — NV1 Security Clearance sponsorship created", event_date:"2025-11-03" },
          { id:"a2", event:"Mattias BRADMAN — NV1 Security Clearance upgrade created", event_date:"2025-11-03" },
        ],
        batches: [mockBatch],
        user: { email:"test@test.com", display_name:"TEST" },
      });
    }
    /* ═══ END TEST MODE ═══ */

    /* ── Real account: look up via Zoho ── */
    const token = await getToken();
    const h = { Authorization: `Zoho-oauthtoken ${token}` };
    const base = "https://www.zohoapis.com.au/crm/v2";

    const searchRes = await fetch(
      `${base}/Accounts/search?criteria=(Account_Reference_Number:equals:${encodeURIComponent(upperAcct)})`,
      { headers: h }
    );
    const searchData = await safeJson(searchRes);
    const searchResult = searchData.data?.[0];
    if (!searchResult) {
      return NextResponse.json({ error: "Invalid account number." }, { status: 404 });
    }
    const ACCOUNT_ID = searchResult.id;

    const [accountRes, dealsRes] = await Promise.all([
      fetch(`${base}/Accounts/${ACCOUNT_ID}`, { headers: h }),
      fetch(`${base}/Deals/search?criteria=(Account_Name.id:equals:${ACCOUNT_ID})&fields=Deal_Name,Stage,Amount,Created_Time,Clearance_Type,Promotional_Offer,Sponsorship_Payment_Upfront,Revalidation_Date&per_page=50`, { headers: h }),
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

    /* Normalise any clearance type string to Baseline/NV1/NV2 — ignore Corporate Clearance (batch deal type) */
    const normClearance = (ct: string): string | null => {
      if (!ct) return null;
      const u = ct.toUpperCase();
      if (u.includes("CORPORATE")) return null;
      if (u.includes("NV2")) return "NV2";
      if (u.includes("NV1")) return "NV1";
      if (u.includes("BASELINE")) return "Baseline";
      return null;
    };
    const AGSVA_FEES: Record<string, number> = { Baseline: 892, NV1: 1897, NV2: 3790 };
    const getAgsva = (ct: string, reqType: string) => {
      if (reqType === "Transfer") return 0;
      const level = normClearance(ct);
      return level ? AGSVA_FEES[level] : 0;
    };
    const REQ_FEES: Record<string, number> = { "New": 410, "Upgrade": 360, "Transfer": 260 };
    const SPON = 1400;

    /* Build deal lookup by name for revalidation dates */
    const dealByName: Record<string, any> = {};
    const dealById: Record<string, any> = {};
    for (const d of allDeals) {
      if (d.Deal_Name) dealByName[d.Deal_Name] = d;
      if (d.id) dealById[d.id] = d;
    }

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

      /* Pull revalidation date from linked deal */
      const linkedDeal = (ne.Linked_Deal?.id && dealById[ne.Linked_Deal.id])
        || (ne.Linked_Deal?.name && dealByName[ne.Linked_Deal.name])
        || null;
      const revalDate = linkedDeal?.Revalidation_Date || null;

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
        revalidation_date:      revalDate,
      };
    };

    const batches = corpDeals.map((cd: any, idx: number) => {
      const keys  = Object.keys(batchMap).sort();
      const key   = keys[idx] || keys[0] || "Unknown";
      const noms  = batchMap[key] || nominees;
      const agsva = noms.reduce((s: number, n: any) => s + getAgsva(n.Clearance_Type, n.Clearance_Request_Type || "New"), 0);
      const app   = noms.reduce((s: number, n: any) => s + (REQ_FEES[n.Clearance_Request_Type] || REQ_FEES["New"]), 0);
      const spon  = noms.length * SPON;
      const promoRaw = cd.Promotional_Offer || "";
      const discountMatch = promoRaw.match(/\$(\d+)/);
      const discountPerHead = discountMatch ? parseInt(discountMatch[1]) : 0;
      const totalDiscount = discountPerHead * noms.length;
      const appAfterDiscount = Math.max(0, app - totalDiscount);
      return {
        id:             cd.id,
        deal_name:      cd.Deal_Name,
        stage:          cd.Stage,
        amount:         agsva + appAfterDiscount + spon,
        created_time:   cd.Created_Time,
        batch_date:     key,
        nominee_count:  noms.length,
        baseline_count: noms.filter((n: any) => normClearance(n.Clearance_Type) === "Baseline").length,
        nv1_count:      noms.filter((n: any) => normClearance(n.Clearance_Type) === "NV1").length,
        nv2_count:      noms.filter((n: any) => normClearance(n.Clearance_Type) === "NV2").length,
        upgrade_count:  noms.filter((n: any) => n.Clearance_Request_Type === "Upgrade").length,
        new_count:      noms.filter((n: any) => n.Clearance_Request_Type !== "Upgrade").length,
        agsva_fees:     agsva,
        app_fees:       appAfterDiscount,
        sponsor_fees:   spon,
        total_fees:     agsva + appAfterDiscount + spon,
        ex_agsva:       appAfterDiscount + spon,
        promotional_offer: promoRaw || null,
        discount:       totalDiscount,
        nominees:       noms.map(buildNominee),
      };
    });

    if (batches.length === 0 && nominees.length > 0) {
      const agsva = nominees.reduce((s: number, n: any) => s + getAgsva(n.Clearance_Type, n.Clearance_Request_Type || "New"), 0);
      const app   = nominees.reduce((s: number, n: any) => s + (REQ_FEES[n.Clearance_Request_Type] || REQ_FEES["New"]), 0);
      const spon  = nominees.length * SPON;
      batches.push({
        id: "batch_1", deal_name: `${account.Account_Name} – Batch 1`,
        stage: corpDeal?.Stage || "Onboard Corporate Account",
        amount: agsva + app + spon, created_time: account.Created_Time,
        batch_date: nominees[0]?.Batch_Date || null,
        nominee_count: nominees.length,
        baseline_count: nominees.filter((n: any) => normClearance(n.Clearance_Type) === "Baseline").length,
        nv1_count:      nominees.filter((n: any) => normClearance(n.Clearance_Type) === "NV1").length,
        nv2_count:      nominees.filter((n: any) => normClearance(n.Clearance_Type) === "NV2").length,
        upgrade_count: 0, new_count: nominees.length,
        agsva_fees: agsva, app_fees: app, sponsor_fees: spon,
        total_fees: agsva + app + spon, ex_agsva: app + spon,
        promotional_offer: corpDeal?.Promotional_Offer || null, discount: 0,
        nominees: nominees.map(buildNominee),
      });
    }

    /* Calculate total discount across all batches */
    const totalPromoDiscount = batches.reduce((s: number, b: any) => s + (b.discount || 0), 0);
    const rawAppFees    = Number(account.Total_Application_Fees) || 0;
    const adjAppFees    = Math.max(0, rawAppFees - totalPromoDiscount);
    const rawTotal      = Number(account.Total_Fees) || 0;
    const adjTotal      = Math.max(0, rawTotal - totalPromoDiscount);
    const rawExAgsva    = Number(account.Total_Fees_Minus_AGSVA) || 0;
    const adjExAgsva    = Math.max(0, rawExAgsva - totalPromoDiscount);

    const responseData = {
      company: {
          company_name:           account.Account_Name,
          abn:                    account.ABN_Number,
          account_number:         account.Account_Reference_Number,
          email:                  account.Billing_Email,
          phone:                  account.Account_Phone,
          website:                account.Website || null,
          industry:               account.Industry || null,
          /* Billing contact */
          billing_first_name:     account.Billing_First_Name || null,
          billing_last_name:      account.Billing_Last_Name || null,
          billing_email:          account.Billing_Email || null,
          billing_phone:          account.Billing_Phone || null,
          billing_job_title:      account.Billing_Job_Title || null,
          /* Billing address */
          billing_street:         account.Billing_Street || null,
          billing_suburb:         account.Suburb || null,
          billing_state:          account.Billing_State || null,
          billing_postcode:       account.Post_code || null,
          billing_country:        account.Billing_Country || null,
          /* Authorised contact */
          auth_first_name:        account.Authorised_Contact_First_Name || account.Authoriser_First_Name || null,
          auth_last_name:         account.Authorised_Contact_Last_Name || account.Authoriser_Last_Name || null,
          auth_email:             account.Authoriser_Email || null,
          auth_phone:             account.Authoriser_Phone || null,
          auth_job_title:         account.Authoriser_Job_Title || null,
          clearance_authoriser:   account.Clearance_Authoriser || null,
          billing_authoriser:     account.Billing_Authoriser || null,
          /* Payment */
          payment_preference:     account.Payment_Preference || null,
          direct_debit:           account.Direct_Debit || false,
          purchase_order:         account.Purchase_Order_Number || null,
          /* Application */
          application_number:     account.Application_Number || null,
          applications_received:  account.Applications_Received || null,
          onboarding_complete:    account.Onboarding_Complete || false,
          /* Totals */
          total_nominees:         Number(account.Total_Nominees)         || 0,
          new_total:              Number(account.New_Total)              || 0,
          upgrade_total:          Number(account.Upgrade_Total)          || 0,
          transfer_total:         Number(account.Transfer_Total)         || 0,
          baseline_total:         Number(account.Baseline_Total)         || 0,
          nv1_total:              Number(account.NV1_Total)              || 0,
          nv2_total:              Number(account.NV2_Total)              || 0,
          total_agsva_fees:       Number(account.Total_AGSVA_Fees)       || 0,
          total_application_fees: adjAppFees,
          total_sponsorship_fees: Number(account.Total_Sponsorship_Fees) || 0,
          total_fees_minus_agsva: adjExAgsva,
          total_fees:             adjTotal,
          corp_deal_stage:        corpDeal?.Stage   || "Onboard Corporate Account",
          corp_deal_name:         corpDeal?.Deal_Name || null,
          corp_deal_amount:       Math.max(0, (corpDeal?.Amount || 0) - totalPromoDiscount),
          corp_deal_created:      corpDeal?.Created_Time || null,
          promotional_offer:      corpDeal?.Promotional_Offer || null,
      },
      personnel: nominees.map(buildNominee),
      activity:  nominees.map((ne: any) => ({
        id:         ne.id + "_act",
        event:      `${ne.First_Name || ""} ${ne.Last_Name || ""} — ${ne.Clearance_Type} sponsorship created`,
        event_date: ne.Batch_Date || account.Created_Time,
      })),
      batches,
      user: { email: account.Billing_Email || "", display_name: account.Account_Name },
    };

    /* Write to Supabase cache for next time */
    const SUPA_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    try {
      await fetch(`${SUPA_URL}/rest/v1/corporate_dashboard_cache`, {
        method: "POST",
        headers: {
          apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({ account_number: upperAcct, data: responseData, updated_at: new Date().toISOString() }),
      });
    } catch { /* cache write failed — not critical */ }

    return NextResponse.json(responseData);

  } catch (err: any) {
    console.error("Dashboard error:", err?.message);
    return NextResponse.json({ error: err?.message || "Failed to load" }, { status: 500 });
  }
}
