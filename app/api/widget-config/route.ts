import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ k: process.env.WIDGET_API_KEY || "" });
}
