import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles, researchRuns } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { generateBriefing } from "@/lib/gemini";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const runId = body.runId as number | undefined;

    let targetArticles;

    if (runId) {
      targetArticles = await db
        .select()
        .from(articles)
        .where(eq(articles.researchRunId, runId));
    } else {
      // Use latest completed run
      const [latestRun] = await db
        .select()
        .from(researchRuns)
        .where(eq(researchRuns.status, "completed"))
        .orderBy(desc(researchRuns.createdAt))
        .limit(1);

      if (!latestRun) {
        return NextResponse.json(
          { error: "No completed research runs found", status: 404 },
          { status: 404 },
        );
      }

      targetArticles = await db
        .select()
        .from(articles)
        .where(eq(articles.researchRunId, latestRun.id));
    }

    if (targetArticles.length === 0) {
      return NextResponse.json(
        { error: "No articles found for briefing", status: 404 },
        { status: 404 },
      );
    }

    const briefing = await generateBriefing(
      targetArticles
        .filter((a) => a.aiSummary && a.aiAnalysis)
        .map((a) => ({
          title: a.title,
          aiSummary: a.aiSummary ?? "",
          aiAnalysis: a.aiAnalysis ?? "",
          importance: a.importance,
        })),
    );

    return NextResponse.json({ data: { briefing }, status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate briefing";
    return NextResponse.json({ error: message, status: 500 }, { status: 500 });
  }
}
