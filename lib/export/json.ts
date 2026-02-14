import { prisma } from "@/lib/db";

export async function exportRunJson(runId: string) {
  const run = await prisma.run.findUniqueOrThrow({
    where: { id: runId },
    include: {
      phases: { orderBy: { created_at: "asc" } },
      newsletters: true,
    },
  });

  const articles = await prisma.article.findMany({
    where: { run_id: runId },
    include: { ranking: true, summary: true },
    orderBy: [{ sort_index: "asc" }, { created_at: "asc" }],
  });

  return {
    run: {
      id: run.id,
      run_name: run.run_name,
      prompt_topic: run.prompt_topic,
      keywords: run.keywords,
      mode: run.mode,
      status: run.status,
      created_at: run.created_at,
    },
    phases: run.phases.map((p) => ({
      phase_name: p.phase_name,
      status: p.status,
      started_at: p.started_at,
      completed_at: p.completed_at,
    })),
    articles: articles.map((a) => ({
      id: a.id,
      url: a.url,
      title: a.title,
      domain: a.domain,
      word_count: a.word_count,
      publish_date: a.publish_date,
      is_relevant: a.is_relevant,
      is_duplicate: a.is_duplicate,
      is_kept: a.is_kept,
      is_shortlisted: a.is_shortlisted,
      ranking: a.ranking
        ? {
            category: a.ranking.category,
            score: a.ranking.score,
            tier: a.ranking.tier,
            key_findings: a.ranking.key_findings,
            key_entities: a.ranking.key_entities,
            rationale: a.ranking.rationale,
            suggested_header: a.ranking.suggested_header,
          }
        : null,
      summary: a.summary
        ? {
            summary_text: a.summary.summary_text,
            why_it_matters: a.summary.why_it_matters,
            implications: a.summary.implications,
          }
        : null,
    })),
    newsletter_count: run.newsletters.length,
  };
}
