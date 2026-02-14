import { prisma } from "@/lib/db";
import { generateJson } from "@/lib/gemini";
import { loadPrompt, fillTemplate } from "@/lib/utils/prompts";
import { withPhaseGuard, type PhaseResult } from "./helpers";
import { z } from "zod";
import pLimit from "p-limit";

const geminiLimit = pLimit(3);

const SummarySchema = z.object({
  summary_text: z.string(),
  why_it_matters: z.array(z.string()),
  implications: z.string().optional(),
});

export async function summariseArticles(runId: string): Promise<PhaseResult> {
  return withPhaseGuard(runId, "summarise_articles", async (logs) => {
    const run = await prisma.run.findUniqueOrThrow({ where: { id: runId } });

    // Check if ranking was done
    const rankPhase = await prisma.runPhase.findUnique({
      where: {
        run_id_phase_name: { run_id: runId, phase_name: "rank_articles" },
      },
    });
    const rankingDone =
      rankPhase?.status === "completed" && run.ranking_enabled;

    // Determine eligible articles
    let articles;
    if (rankingDone) {
      articles = await prisma.article.findMany({
        where: {
          run_id: runId,
          is_shortlisted: true,
          is_kept: true,
        },
        include: { ranking: true },
        orderBy: { ranking: { score: "desc" } },
      });
    } else {
      articles = await prisma.article.findMany({
        where: {
          run_id: runId,
          is_relevant: true,
          is_duplicate: false,
          is_kept: true,
        },
        include: { ranking: true },
      });
    }

    logs.push(`Eligible articles before caps: ${articles.length}`);

    // Apply max_per_domain cap
    const byDomain = new Map<string, typeof articles>();
    for (const art of articles) {
      const domain = art.domain || "unknown";
      const group = byDomain.get(domain) || [];
      group.push(art);
      byDomain.set(domain, group);
    }

    const keptIds = new Set<string>();
    for (const [domain, group] of byDomain) {
      // Sort by score (if ranked) or discovered_at
      const sorted = [...group].sort((a, b) => {
        if (a.ranking && b.ranking) return b.ranking.score - a.ranking.score;
        return (
          a.discovered_at.getTime() - b.discovered_at.getTime()
        );
      });

      const kept = sorted.slice(0, run.max_per_domain);
      const dropped = sorted.slice(run.max_per_domain);

      for (const art of kept) keptIds.add(art.id);
      if (dropped.length > 0) {
        logs.push(
          `Domain cap: ${domain} — kept ${kept.length}, dropped ${dropped.length}`
        );
        for (const art of dropped) {
          await prisma.article.update({
            where: { id: art.id },
            data: { is_shortlisted: false },
          });
        }
      }
    }

    // Apply max_total_articles cap
    let finalArticles = articles.filter((a) => keptIds.has(a.id));
    if (finalArticles.length > run.max_total_articles) {
      // Sort by score desc, keep top N
      const sorted = [...finalArticles].sort((a, b) => {
        if (a.ranking && b.ranking) return b.ranking.score - a.ranking.score;
        return 0;
      });
      const excess = sorted.slice(run.max_total_articles);
      for (const art of excess) {
        await prisma.article.update({
          where: { id: art.id },
          data: { is_shortlisted: false },
        });
      }
      finalArticles = sorted.slice(0, run.max_total_articles);
      logs.push(
        `Total cap: kept ${finalArticles.length}, dropped ${excess.length}`
      );
    }

    logs.push(`Final articles to summarise: ${finalArticles.length}`);

    // Generate summaries
    const systemPrompt = loadPrompt("article_summary_system.txt");
    const userTemplate = loadPrompt("article_summary_user.txt");
    let summarised = 0;

    await Promise.allSettled(
      finalArticles.map((article) =>
        geminiLimit(async () => {
          try {
            const content = (article.content_text || "").slice(0, 4000);
            const tier = article.ranking?.tier || "Unranked";
            const score = article.ranking?.score?.toString() || "N/A";

            const userPrompt = fillTemplate(userTemplate, {
              TOPIC: run.prompt_topic,
              TITLE: article.title || "(untitled)",
              CONTENT: content,
              TIER: tier,
              SCORE: score,
            });

            const result = await generateJson(
              systemPrompt,
              userPrompt,
              SummarySchema
            );

            await prisma.articleSummary.create({
              data: {
                article_id: article.id,
                summary_text: result.summary_text,
                why_it_matters: result.why_it_matters,
                implications: result.implications || null,
              },
            });

            summarised++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logs.push(
              `Summary failed for "${article.title?.slice(0, 50)}" — ${msg}`
            );
          }
        })
      )
    );

    logs.push(`Summarised: ${summarised}/${finalArticles.length}`);
  });
}
