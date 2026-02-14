import { prisma } from "@/lib/db";
import { withPhaseGuard, type PhaseResult } from "./helpers";

export async function saveArticles(runId: string): Promise<PhaseResult> {
  return withPhaseGuard(runId, "save_articles", async (logs) => {
    // Finalization phase — mark run as completed
    const articleCount = await prisma.article.count({
      where: { run_id: runId, is_kept: true, summary: { isNot: null } },
    });

    const newsletterCount = await prisma.newsletter.count({
      where: { run_id: runId },
    });

    await prisma.run.update({
      where: { id: runId },
      data: { status: "completed" },
    });

    logs.push(`Run finalized.`);
    logs.push(`Final articles with summaries: ${articleCount}`);
    logs.push(`Newsletters generated: ${newsletterCount}`);
    logs.push(`Exports available at /api/runs/${runId}/export/json, /export/xlsx, /newsletter`);
  });
}
