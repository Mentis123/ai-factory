import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { id: runId } = await params;
    const body = await request.json();
    const { articleIds, is_kept, sort_index } = body as {
      articleIds: string[];
      is_kept?: boolean;
      sort_index?: number;
    };

    if (!articleIds || !Array.isArray(articleIds)) {
      return NextResponse.json(
        { error: "articleIds array required" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (is_kept !== undefined) updateData.is_kept = is_kept;
    if (sort_index !== undefined) updateData.sort_index = sort_index;

    await prisma.article.updateMany({
      where: { id: { in: articleIds }, run_id: runId },
      data: updateData,
    });

    return NextResponse.json({ updated: articleIds.length });
  } catch (err) {
    console.error("PATCH /api/runs/[id]/articles error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update articles" },
      { status: 500 }
    );
  }
}
