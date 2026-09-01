import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPA_URL = "https://qraxdkzmteogkbfatvir.supabase.co";
const SUPA_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WIDGET_KEY = process.env.WIDGET_API_KEY!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-widget-key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const supa = (path: string, opts?: RequestInit) =>
  fetch(`${SUPA_URL}/rest/v1${path}`, {
    ...opts,
    headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}`, "Content-Type": "application/json", ...opts?.headers },
  });

function checkKey(req: NextRequest) {
  const key = req.headers.get("x-widget-key");
  if (key !== WIDGET_KEY) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
  return null;
}

function corsJson(data: any, status?: number) {
  return NextResponse.json(data, { status: status || 200, headers: CORS });
}

/* GET /api/zoho-widget?clientId=LM84085 — fetch messages */
export async function GET(req: NextRequest) {
  const denied = checkKey(req);
  if (denied) return denied;

  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) return corsJson({ error: "clientId required" }, 400);

  const res = await supa(
    `/client_messages?client_id=eq.${encodeURIComponent(clientId)}&portal_type=eq.corporate&deleted_at=is.null&order=created_at.desc&limit=200`
  );
  const messages = await res.json();
  return corsJson({ messages: Array.isArray(messages) ? messages : [] });
}

/* POST /api/zoho-widget — send message from staff */
export async function POST(req: NextRequest) {
  const denied = checkKey(req);
  if (denied) return denied;

  const body = await req.json();
  const payload = {
    from_type: body.from_type || "admin",
    from_id: body.from_id || "staffuser",
    from_name: body.from_name || "AusClear Team",
    to_id: body.to_id || body.client_id,
    to_name: body.to_name || "",
    client_id: body.client_id,
    subject: body.subject || "",
    message: body.message || "",
    priority: body.priority || "normal",
    category: body.category || "general",
    read_status: body.read_status ?? false,
    attachments: body.attachments || [],
    portal_type: "corporate",
    thread_id: body.thread_id || null,
  };

  const res = await supa("/client_messages", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (Array.isArray(data) && data[0]) return corsJson({ ok: true, message: data[0] });
  return corsJson({ error: "Failed to send" }, 500);
}

/* PATCH /api/zoho-widget — update messages (mark read, delete, restore) */
export async function PATCH(req: NextRequest) {
  const denied = checkKey(req);
  if (denied) return denied;

  const { ids, patch } = await req.json();
  if (!ids?.length || !patch) return corsJson({ error: "ids and patch required" }, 400);

  for (const id of ids) {
    await supa(`/client_messages?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  }
  return corsJson({ ok: true });
}

/* DELETE /api/zoho-widget — permanent delete */
export async function DELETE(req: NextRequest) {
  const denied = checkKey(req);
  if (denied) return denied;

  const { ids } = await req.json();
  if (!ids?.length) return corsJson({ error: "ids required" }, 400);

  for (const id of ids) {
    await supa(`/client_messages?id=eq.${id}`, { method: "DELETE" });
  }
  return corsJson({ ok: true });
}
