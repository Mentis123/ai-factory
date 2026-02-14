import { prisma } from "@/lib/db";
import { generateNewsletterHtml } from "@/lib/export/html";
import { withPhaseGuard, type PhaseResult } from "./helpers";

export async function generateNewsletter(runId: string): Promise<PhaseResult> {
  return withPhaseGuard(
    runId,
    "generate_final_newsletter",
    async (logs) => {
      const run = await prisma.run.findUniqueOrThrow({
        where: { id: runId },
      });

      // Get articles with summaries and rankings, ordered by sort_index then score
      const articles = await prisma.article.findMany({
        where: {
          run_id: runId,
          is_kept: true,
          summary: { isNot: null },
        },
        include: {
          ranking: true,
          summary: true,
        },
        orderBy: [{ sort_index: "asc" }, { created_at: "asc" }],
      });

      if (articles.length === 0) {
        logs.push("No articles with summaries found. Skipping newsletter generation.");
        return;
      }

      // Sort by tier priority then score
      const sorted = [...articles].sort((a, b) => {
        const tierOrder = { Essential: 0, Important: 1, Optional: 2, Unranked: 3 };
        const tierA = (a.ranking?.tier as keyof typeof tierOrder) || "Unranked";
        const tierB = (b.ranking?.tier as keyof typeof tierOrder) || "Unranked";

        if (a.sort_index != null && b.sort_index != null) {
          return a.sort_index - b.sort_index;
        }

        if (tierOrder[tierA] !== tierOrder[tierB]) {
          return tierOrder[tierA] - tierOrder[tierB];
        }

        return (b.ranking?.score || 0) - (a.ranking?.score || 0);
      });

      const title = `${run.prompt_topic} — Newsletter`;
      const html = generateNewsletterHtml(title, sorted);

      await prisma.newsletter.create({
        data: {
          run_id: runId,
          title,
          html_content: html,
        },
      });

      logs.push(
        `Newsletter generated: "${title}" with ${sorted.length} articles.`
      );
    }
  );
}
