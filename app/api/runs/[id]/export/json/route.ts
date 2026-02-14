import { NextResponse } from "next/server";
import { exportRunJson } from "@/lib/export/json";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await exportRunJson(id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
}
