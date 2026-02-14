import { prisma } from "@/lib/db";
import { generateJson } from "@/lib/gemini";
import { loadPrompt, fillTemplate } from "@/lib/utils/prompts";
import { withPhaseGuard, type PhaseResult } from "./helpers";
import { z } from "zod";
import pLimit from "p-limit";

const geminiLimit = pLimit(3);

const RankingSchema = z.object({
  category: z.string(),
  score: z.number(),
  tier: z.enum(["Essential", "Important", "Optional"]),
  key_findings: z.array(z.string()),
  key_entities: z.array(z.string()),
  rationale: z.string(),
  suggested_header: z.string(),
});

export async function rankArticles(runId: string): Promise<PhaseResult> {
  return withPhaseGuard(runId, "rank_articles", async (logs) => {
    const run = await prisma.run.findUniqueOrThrow({ where: { id: runId } });

    if (!run.ranking_enabled) {
      logs.push("Ranking disabled for this run — skipping.");
      // Mark phase as skipped
      await prisma.runPhase.update({
        where: {
          run_id_phase_name: { run_id: runId, phase_name: "rank_articles" },
        },
        data: { status: "skipped" },
      });
      return;
    }

    const articles = await prisma.article.findMany({
      where: {
        run_id: runId,
        is_relevant: true,
        is_duplicate: false,
        is_kept: true,
        content_text: { not: null },
      },
    });

    logs.push(`Ranking ${articles.length} articles...`);

    const systemPrompt = loadPrompt("article_ranking_system.txt");
    const userTemplate = loadPrompt("article_ranking_user.txt");
    let ranked = 0;

    await Promise.allSettled(
      articles.map((article) =>
        geminiLimit(async () => {
          try {
            // Truncate content to fit in context
            const content = (article.content_text || "").slice(0, 6000);
            const userPrompt = fillTemplate(userTemplate, {
              TOPIC: run.prompt_topic,
              TITLE: article.title || "(untitled)",
              DOMAIN: article.domain || "",
              URL: article.url,
              WORD_COUNT: String(article.word_count || 0),
              CONTENT: content,
            });

            const result = await generateJson(
              systemPrompt,
              userPrompt,
              RankingSchema
            );

            await prisma.articleRanking.create({
              data: {
                article_id: article.id,
                category: result.category,
                score: result.score,
                tier: result.tier,
                key_findings: result.key_findings,
                key_entities: result.key_entities,
                rationale: result.rationale,
                suggested_header: result.suggested_header,
                raw_json: JSON.stringify(result),
              },
            });

            // Auto mode: apply min_fit_score
            const shortlisted = result.score >= run.min_fit_score;
            await prisma.article.update({
              where: { id: article.id },
              data: { is_shortlisted: shortlisted },
            });

            ranked++;
            logs.push(
              `${article.title?.slice(0, 50)} → ${result.tier} (${result.score})`
            );
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logs.push(
              `Ranking failed for "${article.title?.slice(0, 50)}" — ${msg}`
            );
          }
        })
      )
    );

    logs.push(`Ranked: ${ranked}/${articles.length}`);
  });
}
