import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const run = await prisma.run.findUnique({
    where: { id },
    include: {
      phases: { orderBy: { created_at: "asc" } },
      articles: {
        include: { ranking: true, summary: true },
        orderBy: [{ sort_index: "asc" }, { created_at: "asc" }],
      },
      newsletters: { orderBy: { created_at: "desc" }, take: 1 },
      profile: true,
    },
  });

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  return NextResponse.json(run);
}
