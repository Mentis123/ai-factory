import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    platform: "ai-navigator",
    timestamp: new Date().toISOString(),
  });
}
