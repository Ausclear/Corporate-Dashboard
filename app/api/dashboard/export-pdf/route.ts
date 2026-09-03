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
@page{size:A4;margin:18mm 22mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#1a1a2e;font-size:11px;line-height:1.5;-webkit-font-smoothing:antialiased;background:#fff}
.page{max-width:700px;margin:0 auto;padding:20px 0}

/* Header */
.hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;margin-bottom:6px;border-bottom:3px solid #c9a84c}
.hdr-left h1{font-size:20px;font-weight:700;color:#1a1a2e;letter-spacing:-.02em}
.hdr-left h1 span{color:#c9a84c}
.hdr-left .sub{color:#8a8a92;font-size:10px;margin-top:3px;letter-spacing:.03em}
.hdr-right{text-align:right}
.hdr-right .rpt{font-size:11px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:.12em}
.hdr-right .date{font-size:10px;color:#8a8a92;margin-top:4px}

/* Confidential */
.conf{text-align:center;margin:14px 0 18px}
.conf span{font-size:8px;color:#c05050;text-transform:uppercase;letter-spacing:.25em;font-weight:700;border:1.5px solid #c0505044;padding:4px 18px;border-radius:3px}

/* Info strip */
.info{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#e2e4e9;margin-bottom:22px;border-radius:6px;overflow:hidden}
.info-i{background:#f8f9fb;padding:12px 14px}
.info-i .l{font-size:8px;color:#8a8a92;text-transform:uppercase;letter-spacing:.12em;font-weight:600}
.info-i .v{font-size:12px;font-weight:600;color:#1a1a2e;margin-top:3px}
.info-i .v.g{color:#9a7530;font-family:'Courier New',monospace;font-weight:700;letter-spacing:.05em}

/* Sections */
.sec{margin-bottom:22px}
.sec-hdr{display:flex;align-items:center;gap:8px;padding-bottom:8px;margin-bottom:14px;border-bottom:2px solid #e8e8ec}
.sec-hdr .n{background:#c9a84c;color:#fff;font-size:9px;width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0}
.sec-hdr h2{font-size:13px;font-weight:700;color:#1a1a2e;letter-spacing:-.01em}

/* Narrative */
.nar p{font-size:11px;line-height:1.75;color:#2a2a3e;margin-bottom:10px;text-align:justify}

/* Promo */
.pro{background:#f0faf4;border:1px solid #c8e8d4;border-left:4px solid #2d8a4e;border-radius:6px;padding:10px 14px;margin-bottom:20px;font-size:10px;color:#2d6b3f;display:flex;align-items:center;gap:8px}

/* Financial cards */
.fg{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
.fc{border:1px solid #e2e4e9;border-radius:6px;padding:12px 10px;text-align:center}
.fc .l{font-size:8px;color:#8a8a92;text-transform:uppercase;letter-spacing:.1em;font-weight:600}
.fc .v{font-size:18px;font-weight:700;color:#1a1a2e;margin-top:3px}
.fc.t{border-color:#c9a84c;background:#fdfbf6;border-width:1.5px}
.fc.t .v{color:#9a7530}

/* Tables */
table{width:100%;border-collapse:collapse;font-size:10px;margin-top:6px}
thead{background:#f4f5f7}
th{color:#1a1a2e;padding:8px 10px;text-align:center;font-size:8px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;border-bottom:2px solid #c9a84c}
th:first-child,th:nth-child(2){text-align:left}
td{padding:8px 10px;border-bottom:1px solid #eee;text-align:center;font-size:10px}
td:first-child,td:nth-child(2){text-align:left}
tr:nth-child(even) td{background:#fafafa}
.b{display:inline-block;padding:2px 8px;border-radius:3px;font-size:8px;font-weight:700;letter-spacing:.02em}
.b1{background:#eef5ee;color:#2d8a4e}.b2{background:#e8f0f8;color:#3a76b0}.b3{background:#faf3e8;color:#9a7530}
.stg{font-size:9px;color:#1a1a2e;font-weight:500}

/* Footer */
.ft{margin-top:30px;padding-top:14px;border-top:2px solid #e2e4e9;text-align:center}
.ft p{margin:2px 0;font-size:8px;color:#8a8a92;letter-spacing:.03em}
.ft .br{font-size:9px;font-weight:700;color:#9a7530;letter-spacing:.12em;margin-bottom:6px}

/* Download bar */
.dl{background:#f4f5f7;border:1px solid #e2e4e9;border-radius:8px;padding:12px 20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center}
.dl span{font-size:11px;color:#8a8a92}
.dl button{background:linear-gradient(135deg,#1a1a2e,#2a2a3e);color:#fff;border:none;padding:10px 28px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:.04em}
.dl button:hover{opacity:.9}
@media print{.dl{display:none !important}}
</style></head><body>
<div class="page">
  <div class="dl">
    <span>Save as PDF using your browser's print function</span>
    <button onclick="window.print()">⬇ Download PDF</button>
  </div>
  <div class="hdr">
    <div class="hdr-left">
      <h1>AusClear <span>Corporate Connect&trade;</span></h1>
      <div class="sub">Nephthys Pty Ltd &nbsp;|&nbsp; ABN 70 628 031 587 &nbsp;|&nbsp; DISP Accredited Sponsor</div>
    </div>
    <div class="hdr-right">
      <div class="rpt">Account Summary</div>
      <div class="date">${now}</div>
    </div>
  </div>
  <div class="conf"><span>Confidential — Commercial in Confidence</span></div>
  <div class="info">
    <div class="info-i"><div class="l">Company</div><div class="v">${co.company_name||"—"}</div></div>
    <div class="info-i"><div class="l">ABN</div><div class="v">${co.abn||"—"}</div></div>
    <div class="info-i"><div class="l">Account</div><div class="v g">${co.account_number||"—"}</div></div>
    <div class="info-i"><div class="l">Nominees</div><div class="v">${co.total_nominees||0}</div></div>
  </div>
  ${co.promotional_offer?`<div class="pro"><strong>Promotional Offer:</strong>&nbsp;${co.promotional_offer}</div>`:""}
  ${aiHtml?`<div class="sec"><div class="sec-hdr"><span class="n">1</span><h2>Executive Summary</h2></div><div class="nar">${aiHtml}</div></div>`:""}
  <div class="sec">
    <div class="sec-hdr"><span class="n">${aiHtml?"2":"1"}</span><h2>Financial Overview</h2></div>
    <div class="fg">
      <div class="fc"><div class="l">Application</div><div class="v">$${(co.total_application_fees||0).toLocaleString()}</div></div>
      <div class="fc"><div class="l">Sponsorship</div><div class="v">$${(co.total_sponsorship_fees||0).toLocaleString()}</div></div>
      <div class="fc"><div class="l">AGSVA</div><div class="v">$${(co.total_agsva_fees||0).toLocaleString()}</div></div>
      <div class="fc t"><div class="l">Total Investment</div><div class="v">$${(co.total_fees||0).toLocaleString()}</div></div>
    </div>
  </div>
  <div class="sec">
    <div class="sec-hdr"><span class="n">${aiHtml?"3":"2"}</span><h2>Personnel Register (${ppl.length})</h2></div>
    <table>
      <thead><tr><th>#</th><th>Employee</th><th>Clearance</th><th>Type</th><th>Stage</th><th>Revalidation</th></tr></thead>
      <tbody>${ppl.map((p:any,i:number)=>{
        const bc=p.clearance_type?.includes("NV2")?"b3":p.clearance_type?.includes("NV1")?"b2":"b1";
        const st=p.stage?.replace(/([a-z])([A-Z])/g,"$1 $2")||"Pending";
        const rv=p.revalidation_date?new Date(p.revalidation_date).toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"}):"—";
        return`<tr><td style="font-weight:600;color:#8a8a92">${i+1}</td><td><strong>${p.employee_name}</strong></td><td><span class="b ${bc}">${p.clearance_type||"—"}</span></td><td>${p.clearance_request_type||"—"}</td><td class="stg">${st}</td><td>${rv}</td></tr>`;
      }).join("")}</tbody>
    </table>
  </div>
  <div class="sec">
    <div class="sec-hdr"><span class="n">${aiHtml?"4":"3"}</span><h2>Clearance Breakdown</h2></div>
    <table>
      <thead><tr><th>Category</th><th>Baseline</th><th>NV1</th><th>NV2</th><th>Total</th></tr></thead>
      <tbody>
        <tr><td>Total Nominees</td><td>${co.baseline_total||0}</td><td>${co.nv1_total||0}</td><td>${co.nv2_total||0}</td><td style="font-weight:700">${co.total_nominees||0}</td></tr>
        <tr><td>New Applications</td><td colspan="3" style="text-align:center">&mdash;</td><td style="font-weight:700">${co.new_total||0}</td></tr>
        <tr><td>Upgrades</td><td colspan="3" style="text-align:center">&mdash;</td><td style="font-weight:700">${co.upgrade_total||0}</td></tr>
        <tr><td>Transfers</td><td colspan="3" style="text-align:center">&mdash;</td><td style="font-weight:700">${co.transfer_total||0}</td></tr>
      </tbody>
    </table>
  </div>
  <div class="ft">
    <p class="br">AUSCLEAR CORPORATE CONNECT&trade;</p>
    <p>Generated ${now} &nbsp;|&nbsp; Data current as at time of generation</p>
    <p>AusClear &nbsp;|&nbsp; Nephthys Pty Ltd &nbsp;|&nbsp; ABN 70 628 031 587</p>
    <p>support@ausclear.com.au &nbsp;|&nbsp; 1300 027 423 &nbsp;|&nbsp; ausclear.au</p>
  </div>
</div>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
