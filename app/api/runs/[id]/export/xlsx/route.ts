import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { exportRunXlsx } from "@/lib/export/xlsx";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const buffer = await exportRunXlsx(id);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="run-${id}.xlsx"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
}
