import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { PHASE_NAMES } from "@/lib/phases/helpers";

export async function GET() {
  try {
    const runs = await prisma.run.findMany({
      orderBy: { created_at: "desc" },
      include: {
        phases: { select: { phase_name: true, status: true } },
        _count: { select: { articles: true } },
      },
    });

    return NextResponse.json(runs);
  } catch (err) {
    console.error("GET /api/runs error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    const {
      run_name,
      prompt_topic,
      keywords = [],
      specific_urls = [],
      source_urls = [],
      lookback_days = 7,
      mode = "auto",
      min_fit_score = 6.0,
      max_total_articles = 12,
      max_per_domain = 4,
      ranking_enabled = true,
      profile_id = null,
    } = body;

    if (!run_name || !prompt_topic) {
      return NextResponse.json(
        { error: "run_name and prompt_topic are required" },
        { status: 400 }
      );
    }

    // If profile_id, merge defaults
    let mergedSourceUrls = source_urls;
    let mergedKeywords = keywords;

    if (profile_id) {
      const profile = await prisma.profile.findUnique({
        where: { id: profile_id },
      });
      if (profile) {
        if (mergedSourceUrls.length === 0) {
          mergedSourceUrls = profile.default_source_urls;
        }
        if (mergedKeywords.length === 0) {
          mergedKeywords = profile.default_keywords;
        }
      }
    }

    const run = await prisma.run.create({
      data: {
        run_name,
        prompt_topic,
        keywords: mergedKeywords,
        specific_urls,
        source_urls: mergedSourceUrls,
        lookback_days,
        mode,
        min_fit_score,
        max_total_articles,
        max_per_domain,
        ranking_enabled,
        profile_id,
      },
    });

    // Create all 7 phase rows
    await prisma.runPhase.createMany({
      data: PHASE_NAMES.map((name) => ({
        run_id: run.id,
        phase_name: name,
      })),
    });

    const created = await prisma.run.findUnique({
      where: { id: run.id },
      include: { phases: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/runs error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create run" },
      { status: 500 }
    );
  }
}
