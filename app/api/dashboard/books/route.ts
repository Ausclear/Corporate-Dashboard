import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BOOKS_CLIENT_ID = process.env.ZOHO_BILLING_CLIENT_ID!;
const BOOKS_CLIENT_SECRET = process.env.ZOHO_BILLING_CLIENT_SECRET!;
const BOOKS_REFRESH = process.env.ZOHO_BILLING_REFRESH_TOKEN!;
const BOOKS_ORG = process.env.ZOHO_BILLING_ORG_ID!;

async function getToken(): Promise<string> {
  const res = await fetch("https://accounts.zoho.com.au/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: BOOKS_CLIENT_ID,
      client_secret: BOOKS_CLIENT_SECRET,
      refresh_token: BOOKS_REFRESH,
    }).toString(),
  });
  const data = await res.json();
  return data.access_token || "";
}

async function booksGet(token: string, endpoint: string) {
  const sep = endpoint.includes("?") ? "&" : "?";
  const url = `https://www.zohoapis.com.au/books/v3${endpoint}${sep}organization_id=${BOOKS_ORG}`;
  const res = await fetch(url, { headers: { Authorization: `Zoho-oauthtoken ${token}` } });
  return res.json();
}

export async function GET(req: NextRequest) {
  const companyName = req.nextUrl.searchParams.get("company_name");
  if (!companyName) return NextResponse.json({ error: "company_name required" }, { status: 400 });

  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: "Books auth failed" }, { status: 500 });

    const contacts = await booksGet(token, `/contacts?contact_name_contains=${encodeURIComponent(companyName)}`);
    const customer = (contacts.contacts || []).find((c: any) =>
      c.contact_name.toLowerCase().includes(companyName.toLowerCase().split(" ")[0])
    );

    if (!customer) return NextResponse.json({ invoices: [], payments: [], customer: null, summary: { totalInvoiced: 0, totalPaid: 0, totalOutstanding: 0, overdueCount: 0, invoiceCount: 0, paymentCount: 0 } });

    const customerId = customer.contact_id;

    const [invRes, payRes] = await Promise.all([
      booksGet(token, `/invoices?customer_id=${customerId}&sort_column=date&sort_order=D`),
      booksGet(token, `/customerpayments?customer_id=${customerId}&sort_column=date&sort_order=D`),
    ]);

    const invoices = (invRes.invoices || []).map((inv: any) => ({
      id: inv.invoice_id,
      number: inv.invoice_number,
      date: inv.date,
      due_date: inv.due_date,
      total: inv.total,
      balance: inv.balance,
      status: inv.status,
      reference: inv.reference_number,
    }));

    const payments = (payRes.customerpayments || payRes.payments || []).map((p: any) => ({
      id: p.payment_id,
      date: p.date,
      amount: p.amount,
      mode: p.payment_mode,
      reference: p.reference_number,
    }));

    const totalInvoiced = invoices.reduce((s: number, i: any) => s + (i.total || 0), 0);
    const totalPaid = invoices.reduce((s: number, i: any) => s + ((i.total || 0) - (i.balance || 0)), 0);
    const totalOutstanding = invoices.reduce((s: number, i: any) => s + (i.balance || 0), 0);
    const overdueCount = invoices.filter((i: any) => i.status === "overdue").length;

    return NextResponse.json({
      customer: { id: customerId, name: customer.contact_name },
      invoices,
      payments,
      summary: { totalInvoiced, totalPaid, totalOutstanding, overdueCount, invoiceCount: invoices.length, paymentCount: payments.length },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Books API error" }, { status: 500 });
  }
}
