import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { researchRuns, articles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { searchAINews } from "@/lib/exa";
import { analyzeArticle } from "@/lib/gemini";

const runSchema = z.object({
  query: z.string().min(1).max(500).default("latest AI industry news and developments"),
  numResults: z.number().int().min(1).max(20).default(8),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = runSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation failed", status: 400 },
        { status: 400 },
      );
    }

    const { query, numResults } = parsed.data;

    // Create research run record
    const [run] = await db
      .insert(researchRuns)
      .values({ query, status: "running" })
      .returning();

    try {
      // Search for articles via Exa
      const results = await searchAINews(query, numResults);

      // Analyze each article with Gemini
      const analyzed = await Promise.all(
        results.map(async (result) => {
          const snippet = result.text ?? "";
          const analysis = await analyzeArticle(result.title, snippet, result.url);

          return {
            researchRunId: run.id,
            title: result.title,
            url: result.url,
            source: new URL(result.url).hostname.replace("www.", ""),
            publishedDate: result.publishedDate ?? null,
            snippet: snippet.slice(0, 500),
            aiSummary: analysis.summary,
            aiAnalysis: analysis.analysis,
            importance: analysis.importance,
          };
        }),
      );

      // Save all articles
      if (analyzed.length > 0) {
        await db.insert(articles).values(analyzed);
      }

      // Mark run as completed
      await db
        .update(researchRuns)
        .set({
          status: "completed",
          articleCount: analyzed.length,
          completedAt: new Date(),
        })
        .where(eq(researchRuns.id, run.id));

      // Fetch the complete run with articles
      const savedArticles = await db
        .select()
        .from(articles)
        .where(eq(articles.researchRunId, run.id));

      return NextResponse.json(
        {
          data: { ...run, status: "completed", articleCount: analyzed.length, articles: savedArticles },
          status: 201,
        },
        { status: 201 },
      );
    } catch (pipelineError) {
      // Mark run as failed
      const errorMsg = pipelineError instanceof Error ? pipelineError.message : "Pipeline failed";
      await db
        .update(researchRuns)
        .set({ status: "failed", error: errorMsg })
        .where(eq(researchRuns.id, run.id));

      return NextResponse.json(
        { error: `Research pipeline failed: ${errorMsg}`, status: 500 },
        { status: 500 },
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run research";
    return NextResponse.json({ error: message, status: 500 }, { status: 500 });
  }
}
