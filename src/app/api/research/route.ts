import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { researchRuns, articles } from "@/lib/db/schema";
import { desc, eq, asc } from "drizzle-orm";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "5", 10), 20);

    const runs = await db
      .select()
      .from(researchRuns)
      .orderBy(desc(researchRuns.createdAt))
      .limit(limit);

    const runsWithArticles = await Promise.all(
      runs.map(async (run) => {
        const runArticles = await db
          .select()
          .from(articles)
          .where(eq(articles.researchRunId, run.id))
          .orderBy(desc(articles.importance), asc(articles.id));

        return { ...run, articles: runArticles };
      }),
    );

    return NextResponse.json({ data: runsWithArticles, status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch research";
    return NextResponse.json({ error: message, status: 500 }, { status: 500 });
  }
}
