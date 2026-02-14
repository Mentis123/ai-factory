import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { exportRunJson } from "@/lib/export/json";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const data = await exportRunJson(id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
}
