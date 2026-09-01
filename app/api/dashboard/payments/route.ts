import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/* ── Zoho CRM (to look up billing email from account number) ────────────── */
const ZOHO_CLIENT_ID     = process.env.ZOHO_CLIENT_ID     || ''
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || ''
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN || ''

let zohoToken: string | null = null
let zohoExpiry = 0

async function getZohoToken(): Promise<string> {
  if (zohoToken && Date.now() < zohoExpiry) return zohoToken
  const res = await fetch('https://accounts.zoho.com.au/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      refresh_token: ZOHO_REFRESH_TOKEN,
    }).toString(),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Zoho CRM token refresh failed')
  zohoToken = data.access_token
  zohoExpiry = Date.now() + 50 * 60 * 1000
  return zohoToken!
}

/* ── GoCardless ─────────────────────────────────────────────────────────── */
const GC_ACCESS_TOKEN = process.env.GC_ACCESS_TOKEN || ''
const GC_API_BASE     = 'https://api.gocardless.com'
const GC_HEADERS      = {
  'Authorization': `Bearer ${GC_ACCESS_TOKEN}`,
  'GoCardless-Version': '2015-07-06',
  'Content-Type': 'application/json',
}

async function gcFetch(endpoint: string, params?: Record<string, string>) {
  const url = new URL(`${GC_API_BASE}${endpoint}`)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { headers: GC_HEADERS })
  if (!res.ok) throw new Error(`GoCardless ${endpoint}: ${res.status}`)
  return res.json()
}

async function gcFindCustomersByEmail(email: string) {
  try {
    const data = await gcFetch('/customers', { email: email.toLowerCase() })
    return data.customers || []
  } catch { return [] }
}

async function gcGetSubscriptions(customerId: string) {
  try {
    const data = await gcFetch('/subscriptions', { customer: customerId })
    return data.subscriptions || []
  } catch { return [] }
}

async function gcGetPayments(params: Record<string, string>) {
  try {
    const data = await gcFetch('/payments', params)
    return data.payments || []
  } catch { return [] }
}

/* ── Zoho Books ─────────────────────────────────────────────────────────── */
const BOOKS_CLIENT_ID     = process.env.ZOHO_BILLING_CLIENT_ID     || ''
const BOOKS_CLIENT_SECRET = process.env.ZOHO_BILLING_CLIENT_SECRET || ''
const BOOKS_REFRESH_TOKEN = process.env.ZOHO_BILLING_REFRESH_TOKEN || ''
const BOOKS_ORG_ID        = process.env.ZOHO_BILLING_ORG_ID        || ''
const BOOKS_BASE          = 'https://www.zohoapis.com.au/books/v3'

let booksToken: string | null = null
let booksExpiry = 0

async function getBooksToken(): Promise<string> {
  if (booksToken && Date.now() < booksExpiry) return booksToken
  const res = await fetch('https://accounts.zoho.com.au/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: BOOKS_CLIENT_ID,
      client_secret: BOOKS_CLIENT_SECRET,
      refresh_token: BOOKS_REFRESH_TOKEN,
    }).toString(),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Books token refresh failed')
  booksToken = data.access_token
  booksExpiry = Date.now() + 50 * 60 * 1000
  return booksToken!
}

async function booksGet(path: string) {
  const token = await getBooksToken()
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${BOOKS_BASE}${path}${sep}organization_id=${BOOKS_ORG_ID}`, {
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
  })
  if (!res.ok) throw new Error(`Books API ${res.status}: ${path}`)
  return res.json()
}

async function booksFindContact(email: string) {
  try {
    const data = await booksGet(`/contacts?email=${encodeURIComponent(email)}`)
    const contacts = data.contacts || []
    if (contacts.length > 0) return contacts[0]
    // Fallback: search by email as text
    const data2 = await booksGet(`/contacts?search_text=${encodeURIComponent(email)}`)
    return (data2.contacts || [])[0] || null
  } catch { return null }
}

async function booksSearchInvoices(booksCustomerNumber: string, companyName: string) {
  try {
    // Use the Zoho Books Customer Number from CRM to find invoices
    if (booksCustomerNumber) {
      const data = await booksGet(`/invoices?search_text=${encodeURIComponent(booksCustomerNumber)}&sort_column=date&sort_order=D&per_page=200`)
      const invoices = data.invoices || []
      if (invoices.length > 0) return invoices
    }
    // Fallback to company name
    const data = await booksGet(`/invoices?customer_name=${encodeURIComponent(companyName)}&sort_column=date&sort_order=D&per_page=200`)
    return data.invoices || []
  } catch { return [] }
}

/* ── Status helpers ─────────────────────────────────────────────────────── */
function mapPaymentStatus(status: string) {
  switch (status) {
    case 'confirmed': case 'paid_out':
      return { label: 'Paid', colour: '#4ade80' }
    case 'pending_submission': case 'pending_customer_approval': case 'submitted':
      return { label: 'Processing', colour: '#c9a84c' }
    case 'failed': case 'customer_approval_denied':
      return { label: 'Failed', colour: '#ef4444' }
    case 'cancelled':
      return { label: 'Cancelled', colour: '#6b7280' }
    case 'charged_back':
      return { label: 'Charged Back', colour: '#ef4444' }
    default:
      return { label: status, colour: '#6b7280' }
  }
}

function mapInvoiceStatus(status: string) {
  switch (status) {
    case 'paid':
      return { label: 'Paid', colour: '#4ade80' }
    case 'sent': case 'viewed':
      return { label: 'Outstanding', colour: '#c9a84c' }
    case 'overdue':
      return { label: 'Overdue', colour: '#ef4444' }
    case 'partially_paid':
      return { label: 'Partially Paid', colour: '#c9a84c' }
    case 'void':
      return { label: 'Voided', colour: '#6b7280' }
    case 'draft':
      return { label: 'Draft', colour: '#6b7280' }
    default:
      return { label: status, colour: '#6b7280' }
  }
}

/* ── Route ──────────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const accountNumber = req.nextUrl.searchParams.get('account_number')
    if (!accountNumber) return NextResponse.json({ error: 'Missing account_number' }, { status: 400 })
    const upperAcct = accountNumber.toUpperCase()

    /* 1. Look up account in Zoho CRM to get billing email */
    const crmToken = await getZohoToken()
    const crmRes = await fetch(
      `https://www.zohoapis.com.au/crm/v2/Accounts/search?criteria=(Account_Reference_Number:equals:${encodeURIComponent(upperAcct)})`,
      { headers: { Authorization: `Zoho-oauthtoken ${crmToken}` } }
    )

    // Zoho CRM returns 204 with empty body when no results
    if (crmRes.status === 204 || crmRes.status === 404) {
      return NextResponse.json({ success: true, hasDirectDebit: false, summary: { totalPaid: "0.00", totalOutstanding: "0.00", nextDebit: null, paymentCount: 0, invoiceCount: 0 }, payments: [], upcoming: [], subscriptions: [], invoices: [] })
    }

    const crmText = await crmRes.text()
    let crmData: any
    try { crmData = JSON.parse(crmText) } catch { return NextResponse.json({ success: true, hasDirectDebit: false, summary: { totalPaid: "0.00", totalOutstanding: "0.00", nextDebit: null, paymentCount: 0, invoiceCount: 0 }, payments: [], upcoming: [], subscriptions: [], invoices: [] }) }

    const account = crmData.data?.[0]
    if (!account) return NextResponse.json({ success: true, hasDirectDebit: false, summary: { totalPaid: "0.00", totalOutstanding: "0.00", nextDebit: null, paymentCount: 0, invoiceCount: 0 }, payments: [], upcoming: [], subscriptions: [], invoices: [] })

    const billingEmail = account.Billing_Email || ''
    const companyName  = account.Account_Name || ''
    const booksCustomerNumber = account.Zoho_Books_Customer_Number || ''
    const paymentPreference = account.Payment_Preference || 'Not set'
    if (!billingEmail) return NextResponse.json({ error: 'No billing email on account' }, { status: 400 })

    /* 2. GoCardless — find customer, subscriptions, and payments */
    const gcCustomers = await gcFindCustomersByEmail(billingEmail)
    const gcCustomerIds = gcCustomers.map((c: any) => c.id)

    let gcPayments: any[] = []
    let gcSubscriptions: any[] = []
    let gcUpcoming: any[] = []

    for (const custId of gcCustomerIds) {
      const subs = await gcGetSubscriptions(custId)
      for (const sub of subs) {
        gcSubscriptions.push({
          id:           sub.id,
          name:         sub.name || 'Direct Debit',
          status:       sub.status,
          amount:       (sub.amount / 100).toFixed(2),
          interval:     sub.interval,
          intervalUnit: sub.interval_unit,
          upcomingDate: sub.upcoming_payments?.[0]?.charge_date || null,
        })
        if (sub.upcoming_payments?.length) {
          for (const up of sub.upcoming_payments) {
            gcUpcoming.push({
              date:   up.charge_date,
              amount: (up.amount / 100).toFixed(2),
              name:   sub.name || 'Direct Debit',
            })
          }
        }
      }

      const payments = await gcGetPayments({ customer: custId })
      for (const p of payments) {
        const st = mapPaymentStatus(p.status)
        gcPayments.push({
          id:     p.id,
          date:   p.charge_date,
          amount: (p.amount / 100).toFixed(2),
          status: st.label,
          colour: st.colour,
          description: p.description || null,
        })
      }
    }

    gcPayments.sort((a, b) => b.date.localeCompare(a.date))
    gcUpcoming.sort((a, b) => a.date.localeCompare(b.date))

    /* 3. Zoho Books — search invoices by company name */
    const rawInvoices = await booksSearchInvoices(booksCustomerNumber, companyName)
    const invoices = rawInvoices.map((inv: any) => {
        const st = mapInvoiceStatus(inv.status)
        return {
          id:            inv.invoice_id,
          number:        inv.invoice_number,
          date:          inv.date,
          dueDate:       inv.due_date,
          total:         inv.total,
          balance:       inv.balance,
          status:        st.label,
          colour:        st.colour,
          reference:     inv.reference_number || null,
          lineItems:     (inv.line_items || []).map((li: any) => ({
            description: li.description || li.name,
            amount:      li.item_total,
          })),
        }
      })

    /* 4. Summary */
    const totalPaid = gcPayments
      .filter((p: any) => p.status === 'Paid')
      .reduce((s: number, p: any) => s + parseFloat(p.amount), 0)
    const totalOutstanding = invoices
      .filter((i: any) => i.status === 'Outstanding' || i.status === 'Overdue' || i.status === 'Partially Paid')
      .reduce((s: number, i: any) => s + (i.balance || 0), 0)
    const nextDebit = gcUpcoming[0] || null

    return NextResponse.json({
      success: true,
      companyName,
      billingEmail,
      paymentPreference,
      hasDirectDebit: gcCustomerIds.length > 0,
      summary: {
        totalPaid:       totalPaid.toFixed(2),
        totalOutstanding: totalOutstanding.toFixed(2),
        nextDebit:       nextDebit ? { date: nextDebit.date, amount: nextDebit.amount } : null,
        paymentCount:    gcPayments.length,
        invoiceCount:    invoices.length,
      },
      payments:       gcPayments,
      upcoming:       gcUpcoming.slice(0, 8),
      subscriptions:  gcSubscriptions,
      invoices,
    })

  } catch (err: any) {
    console.error('[/api/dashboard/payments]', err?.message)
    return NextResponse.json({ error: err?.message || 'Failed to load payments' }, { status: 500 })
  }
}
