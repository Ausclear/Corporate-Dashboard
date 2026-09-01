import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CLIENT_ID     = process.env.ZOHO_CLIENT_ID     || "";
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || "";
const REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN || "";

async function getToken(): Promise<string> {
  const res = await fetch("https://accounts.zoho.com.au/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token", client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET, refresh_token: REFRESH_TOKEN,
    }).toString(),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Token failed");
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const { account_number, employees } = await request.json();

    if (!account_number || !employees?.length) {
      return NextResponse.json({ error: "Account number and employees are required" }, { status: 400 });
    }

    /* Validate each employee has required fields */
    for (const emp of employees) {
      if (!emp.first_name || !emp.last_name || !emp.email || !emp.clearance_type || !emp.request_type) {
        return NextResponse.json({ error: "All employees must have first name, last name, email, clearance type, and request type" }, { status: 400 });
      }
    }

    const token = await getToken();
    const h = { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" };
    const base = "https://www.zohoapis.com.au/crm/v2";

    /* Look up account by reference number */
    const searchRes = await fetch(
      `${base}/Accounts/search?criteria=(Account_Reference_Number:equals:${encodeURIComponent(account_number.toUpperCase().trim())})`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    );
    const searchText = await searchRes.text();
    if (!searchText.trim()) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    const searchData = JSON.parse(searchText);
    const account = searchData.data?.[0];
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const accountId = account.id;

    /* Get existing nominated employees subform */
    const acctRes = await fetch(`${base}/Accounts/${accountId}`, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
    });
    const acctText = await acctRes.text();
    if (!acctText.trim()) {
      return NextResponse.json({ error: "Could not fetch account details" }, { status: 500 });
    }
    const acctData = JSON.parse(acctText);
    const fullAccount = acctData.data?.[0];
    const existingNominees = fullAccount?.Nominated_Employees || [];

    /* Find highest existing employee number */
    const maxNumber = existingNominees.reduce((max: number, n: any) => {
      const num = Number(n.Number) || 0;
      return num > max ? num : max;
    }, 0);

    /* Build new nominee rows with sequential numbers */
    const newNominees = employees.map((emp: any, idx: number) => ({
      First_Name: emp.first_name.trim(),
      Last_Name: emp.last_name.toUpperCase().trim(),
      Email: emp.email.trim(),
      Mobile: emp.mobile?.trim() || "",
      Clearance_Type: emp.clearance_type,
      Clearance_Request_Type: emp.request_type,
      Number: maxNumber + idx + 1,
    }));

    /* Merge with existing nominees — preserve all existing fields including Number */
    const allNominees = [...existingNominees.map((n: any) => ({
      id: n.id,
      First_Name: n.First_Name,
      Last_Name: n.Last_Name,
      Email: n.Email,
      Mobile: n.Mobile,
      Number: n.Number,
      Clearance_Type: n.Clearance_Type,
      Clearance_Request_Type: n.Clearance_Request_Type,
      Batch_Date: n.Batch_Date,
      Deal_Stage: n.Deal_Stage,
      Onboarding_Status: n.Onboarding_Status,
    })), ...newNominees];

    /* Update account with merged subform */
    const updateRes = await fetch(`${base}/Accounts/${accountId}`, {
      method: "PUT",
      headers: h,
      body: JSON.stringify({
        data: [{
          id: accountId,
          Nominated_Employees: allNominees,
        }],
      }),
    });

    const updateData = await updateRes.json();

    if (updateData.data?.[0]?.code === "SUCCESS") {
      const employeeList = newNominees.map((n: any) =>
        `${n.First_Name} ${n.Last_Name} — ${n.Clearance_Type} (${n.Clearance_Request_Type}) #${n.Number}`
      ).join("\n");

      /* Add a note to the Account for audit trail */
      try {
        await fetch(`${base}/Notes`, {
          method: "POST",
          headers: h,
          body: JSON.stringify({
            data: [{
              Note_Title: `${newNominees.length} Employee${newNominees.length !== 1 ? "s" : ""} Nominated via Corporate Connect`,
              Note_Content: `The following employee${newNominees.length !== 1 ? "s were" : " was"} nominated through AusClear Corporate Connect™:\n\n${employeeList}\n\nTotal nominees now: ${allNominees.length}`,
              Parent_Id: accountId,
              se_module: "Accounts",
            }],
          }),
        });
      } catch { /* note failed — not critical */ }

      /* Task — actionable item for staff to review and process the nomination */
      try {
        const contactRes = await fetch(
          `${base}/Contacts/search?criteria=(Account_Name.id:equals:${accountId})&per_page=1`,
          { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
        );
        const contactText = await contactRes.text();
        const contactId = contactText.trim() ? JSON.parse(contactText).data?.[0]?.id : null;
        const dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const taskPayload: any = {
          Subject: `Corporate Connect Nomination: ${account.Account_Name} — ${account.Account_Reference_Number}`,
          Status: "Not Started",
          Priority: "High",
          Due_Date: dueDate,
          Description: `${account.Account_Name} (${account.Account_Reference_Number}) has nominated ${newNominees.length} employee${newNominees.length !== 1 ? "s" : ""} via AusClear Corporate Connect™.\n\n${employeeList}\n\nACTION REQUIRED\n1. Review the nomination details on the Account\n2. Verify employee information\n3. Process the sponsorship application\n4. Close this task once actioned`,
        };
        if (contactId) taskPayload.Who_Id = contactId;
        taskPayload.What_Id = accountId;
        taskPayload.$se_module = "Accounts";

        await fetch(`${base}/Tasks`, {
          method: "POST",
          headers: h,
          body: JSON.stringify({ data: [taskPayload], trigger: ["workflow"] }),
        });
      } catch { /* task failed — not critical */ }

      /* Signal — find primary Contact on the Account for the bell notification */
      try {
        const contactRes2 = await fetch(
          `${base}/Contacts/search?criteria=(Account_Name.id:equals:${accountId})&per_page=1`,
          { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
        );
        const contactText2 = await contactRes2.text();
        const contactId2 = contactText2.trim() ? JSON.parse(contactText2).data?.[0]?.id : null;
        if (contactId2) {
          const employeeNames = newNominees.map((n: any) => `*${n.First_Name} ${n.Last_Name}*`).join(", ");
          await fetch("https://www.zohoapis.com.au/crm/v2/signals/notifications", {
            method: "POST",
            headers: h,
            body: JSON.stringify({
              signals: [{
                signal_namespace: "clientcommunications_ausclearclientmessages",
                subject: `${newNominees.length} Employee${newNominees.length !== 1 ? "s" : ""} Nominated — ${account.Account_Reference_Number}`,
                message: `${employeeNames} nominated for clearance by ${account.Account_Name} (${account.Account_Reference_Number}) via Corporate Connect™.`,
                id: contactId2,
                actions: [{
                  type: "link",
                  open_in: "popup",
                  display_name: "View Account",
                  url: `https://crm.zoho.com.au/crm/org7004248892/tab/Accounts/${accountId}`,
                }],
              }],
            }),
          });
        }
      } catch { /* signal failed — not critical */ }

      return NextResponse.json({
        ok: true,
        message: `${newNominees.length} employee${newNominees.length !== 1 ? "s" : ""} nominated successfully`,
        total_nominees: allNominees.length,
      });
    } else {
      console.error("Zoho update failed:", JSON.stringify(updateData));
      return NextResponse.json({
        error: updateData.data?.[0]?.message || "Failed to update account",
        details: updateData,
      }, { status: 500 });
    }

  } catch (err: any) {
    console.error("Nominate error:", err?.message);
    return NextResponse.json({ error: err?.message || "Failed to nominate" }, { status: 500 });
  }
}
