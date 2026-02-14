import { NextResponse } from "next/server";

export function requireAdmin(request: Request): NextResponse | null {
  const token = request.headers.get("x-admin-token");
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
