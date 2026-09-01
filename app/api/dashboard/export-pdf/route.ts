import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPA_URL = "https://qraxdkzmteogkbfatvir.supabase.co";
const SUPA_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const acct = searchParams.get("account_number")?.toUpperCase().trim();
  if (!acct) return NextResponse.json({ error: "Account number required" }, { status: 400 });

  let data: any;
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/corporate_dashboard_cache?account_number=eq.${encodeURIComponent(acct)}&select=data&limit=1`,
      { headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}` } });
    const rows = await r.json();
    if (Array.isArray(rows) && rows[0]?.data) data = rows[0].data;
  } catch {}
  if (!data) {
    try {
      const origin = new URL(request.url).origin;
      const r = await fetch(`${origin}/api/dashboard/data?account_number=${encodeURIComponent(acct)}`);
      data = await r.json();
    } catch {}
  }
  if (!data?.company) return NextResponse.json({ error: "No data" }, { status: 404 });

  const co = data.company;
  const ppl = data.personnel || [];
  const now = new Date().toLocaleDateString("en-AU", { day:"numeric", month:"long", year:"numeric" });

  let aiSummary = "";
  const key = process.env.ANTHROPIC_API_KEY;
  if (key) {
    try {
      const pplTxt = ppl.map((p: any) => `${p.employee_name} — ${p.clearance_type} (${p.clearance_request_type}), stage: ${p.stage || "pending"}`).join("\n");
      const prompt = `Write a brief executive summary (2 short paragraphs, 4-5 sentences total) for this corporate security clearance account. Name each employee and their current stage. British English. Plain text only, no markdown, no headings.\n\nCompany: ${co.company_name} (${co.account_number})\nNominees: ${co.total_nominees || 0} | Investment: $${(co.total_fees || 0).toLocaleString()}\n${co.promotional_offer ? `Promo: ${co.promotional_offer}` : ""}\nPersonnel:\n${pplTxt || "None"}`;

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 300, messages: [{ role: "user", content: prompt }] }),
      });
      aiSummary = (await r.json()).content?.[0]?.text || "";
    } catch {}
  }

  const aiHtml = aiSummary.split("\n").filter((p: string) => p.trim()).map((p: string) => `<p>${p}</p>`).join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${co.company_name} — Account Summary</title>
<style>
@page{size:A4;margin:20mm 24mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif;color:#1a1a2e;font-size:11px;line-height:1.6;-webkit-font-smoothing:antialiased;background:#fff}
.page{max-width:680px;margin:0 auto;padding:24px 0}
.hdr{border-bottom:3px solid #c9a84c;padding-bottom:20px;margin-bottom:20px}
.hdr h1{font-size:22px;font-weight:700;color:#1a1a2e;letter-spacing:.3px}
.hdr h1 span{color:#c9a84c}
.hdr .sub{color:#7a7a82;font-size:11px;margin-top:4px}
.hdr .rpt{margin-top:10px;font-size:12px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:.15em}
.conf{text-align:center;margin-bottom:18px}
.conf span{font-size:9px;color:#c05050;text-transform:uppercase;letter-spacing:.2em;font-weight:700;border:1px solid #c0505033;padding:4px 14px;border-radius:3px}
.mb{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;padding:16px 0;margin-bottom:20px;border-bottom:2px solid #e2e4e9}
.mi .l{font-size:9px;color:#7a7a82;text-transform:uppercase;letter-spacing:.12em;font-weight:600}
.mi .v{font-size:13px;font-weight:600;color:#1a1a2e;margin-top:3px}
.mi .v.g{color:#9a7530;font-family:'Courier New',monospace;font-weight:700}
.sec{margin-bottom:24px}
.sec h2{font-size:14px;font-weight:700;color:#1a1a2e;border-bottom:2px solid #c9a84c;padding-bottom:8px;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.sec h2 .n{background:#c9a84c;color:#fff;font-size:10px;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700}
.nar p{font-size:11.5px;line-height:1.8;color:#2a2a3e;margin-bottom:12px;text-align:justify}
.pro{background:#f0faf4;border:1px solid #b8e6c8;border-left:4px solid #2d8a4e;border-radius:6px;padding:12px 16px;margin-bottom:20px;font-size:11px;color:#2d6b3f}
.fg{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:16px}
.fc{border:1px solid #e2e4e9;border-radius:8px;padding:14px;text-align:center}
.fc .l{font-size:9px;color:#7a7a82;text-transform:uppercase;letter-spacing:.1em;font-weight:600}
.fc .v{font-size:20px;font-weight:700;color:#1a1a2e;margin-top:4px}
.fc.t{border-top:3px solid #c9a84c;background:#faf8f3}
.fc.t .v{color:#9a7530}
table{width:100%;border-collapse:collapse;font-size:10px;margin-top:8px}
th{background:#f4f5f7;color:#1a1a2e;padding:10px 12px;text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;border-bottom:2px solid #c9a84c}
th:first-child{text-align:left}
td{padding:9px 12px;border-bottom:1px solid #e8e8ec;text-align:center}
td:first-child{text-align:left}
tr:nth-child(even) td{background:#f8f9fa}
.b{display:inline-block;padding:3px 10px;border-radius:4px;font-size:9px;font-weight:600}
.b1{background:#eef5ee;color:#2d8a4e}.b2{background:#e8f0f8;color:#3a76b0}.b3{background:#faf3e8;color:#9a7530}
.ft{margin-top:36px;padding-top:16px;border-top:2px solid #e2e4e9;text-align:center}
.ft p{margin:3px 0;font-size:9px;color:#7a7a82}
.ft .br{font-size:10px;font-weight:700;color:#9a7530;letter-spacing:.1em}
.dl-bar{background:#f4f5f7;border:1px solid #e2e4e9;border-radius:8px;padding:12px 20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center}
.dl-bar button{background:#1a1a2e;color:#fff;border:none;padding:10px 24px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:.05em}
.dl-bar button:hover{background:#2a2a3e}
@media print{.dl-bar{display:none !important}}
</style></head><body>
<div class="page">
  <div class="dl-bar">
    <span style="font-size:12px;color:#7a7a82">Save this report as PDF using your browser's print function</span>
    <button onclick="window.print()">⬇ Download PDF</button>
  </div>
  <div class="hdr">
    <h1>AusClear <span>Corporate Connect&trade;</span></h1>
    <div class="sub">Nephthys Pty Ltd | ABN 70 628 031 587 | DISP Accredited Sponsor</div>
    <div class="rpt">Corporate Account Summary Report</div>
  </div>
  <div class="conf"><span>Confidential</span></div>
  <div class="mb">
    <div class="mi"><div class="l">Company</div><div class="v">${co.company_name||"—"}</div></div>
    <div class="mi"><div class="l">ABN</div><div class="v">${co.abn||"—"}</div></div>
    <div class="mi"><div class="l">Account</div><div class="v g">${co.account_number||"—"}</div></div>
    <div class="mi"><div class="l">Report Date</div><div class="v">${now}</div></div>
  </div>
  ${co.promotional_offer?`<div class="pro"><strong>Promotional Offer Applied:</strong> ${co.promotional_offer}</div>`:""}
  ${aiHtml?`<div class="sec"><h2><span class="n">1</span> Executive Summary</h2><div class="nar">${aiHtml}</div></div>`:""}
  <div class="sec">
    <h2><span class="n">${aiHtml?"2":"1"}</span> Financial Overview</h2>
    <div class="fg">
      <div class="fc"><div class="l">Application</div><div class="v">$${(co.total_application_fees||0).toLocaleString()}</div></div>
      <div class="fc"><div class="l">Sponsorship</div><div class="v">$${(co.total_sponsorship_fees||0).toLocaleString()}</div></div>
      <div class="fc"><div class="l">AGSVA</div><div class="v">$${(co.total_agsva_fees||0).toLocaleString()}</div></div>
      <div class="fc t"><div class="l">Total Investment</div><div class="v">$${(co.total_fees||0).toLocaleString()}</div></div>
    </div>
  </div>
  <div class="sec">
    <h2><span class="n">${aiHtml?"3":"2"}</span> Personnel Register (${ppl.length})</h2>
    <table>
      <thead><tr><th style="text-align:left">#</th><th style="text-align:left">Employee</th><th>Clearance</th><th>Request</th><th>Current Stage</th><th>Revalidation</th></tr></thead>
      <tbody>${ppl.map((p:any,i:number)=>{
        const bc=p.clearance_type?.includes("NV2")?"b3":p.clearance_type?.includes("NV1")?"b2":"b1";
        const st=p.stage?.replace(/([a-z])([A-Z])/g,"$1 $2")||"Pending";
        const rv=p.revalidation_date?new Date(p.revalidation_date).toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"}):"—";
        return`<tr><td style="text-align:left;font-weight:600;color:#7a7a82">${i+1}</td><td style="text-align:left"><strong>${p.employee_name}</strong></td><td><span class="b ${bc}">${p.clearance_type||"—"}</span></td><td>${p.clearance_request_type||"—"}</td><td>${st}</td><td>${rv}</td></tr>`;
      }).join("")}</tbody>
    </table>
  </div>
  <div class="sec">
    <h2><span class="n">${aiHtml?"4":"3"}</span> Clearance Breakdown</h2>
    <table>
      <thead><tr><th style="text-align:left">Metric</th><th>Baseline</th><th>NV1</th><th>NV2</th><th>Total</th></tr></thead>
      <tbody>
        <tr><td style="text-align:left">Nominees</td><td>${co.baseline_total||0}</td><td>${co.nv1_total||0}</td><td>${co.nv2_total||0}</td><td style="font-weight:700">${co.total_nominees||0}</td></tr>
        <tr><td style="text-align:left">New</td><td>${co.baseline_total&&co.new_total?co.new_total:0}</td><td>${co.nv1_total&&co.new_total?co.new_total:0}</td><td>${co.nv2_total&&co.new_total?co.new_total:0}</td><td style="font-weight:700">${co.new_total||0}</td></tr>
        <tr><td style="text-align:left">Upgrade</td><td>${co.baseline_total&&co.upgrade_total?co.upgrade_total:0}</td><td>${co.nv1_total&&co.upgrade_total?co.upgrade_total:0}</td><td>${co.nv2_total&&co.upgrade_total?co.upgrade_total:0}</td><td style="font-weight:700">${co.upgrade_total||0}</td></tr>
        <tr><td style="text-align:left">Transfer</td><td>${co.baseline_total&&co.transfer_total?co.transfer_total:0}</td><td>${co.nv1_total&&co.transfer_total?co.transfer_total:0}</td><td>${co.nv2_total&&co.transfer_total?co.transfer_total:0}</td><td style="font-weight:700">${co.transfer_total||0}</td></tr>
      </tbody>
    </table>
  </div>
  <div class="ft">
    <p class="br">AUSCLEAR CORPORATE CONNECT&trade;</p>
    <p>This report was generated on ${now} and reflects data as at the time of generation.</p>
    <p>AusClear | Nephthys Pty Ltd | ABN 70 628 031 587 | DISP Accredited Sponsor</p>
    <p>support@ausclear.com.au | 1300 027 423 | ausclear.au</p>
  </div>
</div>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
