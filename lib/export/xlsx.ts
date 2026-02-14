import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";

export async function exportRunXlsx(runId: string): Promise<Buffer> {
  const articles = await prisma.article.findMany({
    where: { run_id: runId },
    include: { ranking: true, summary: true },
    orderBy: [{ sort_index: "asc" }, { created_at: "asc" }],
  });

  const workbook = new ExcelJS.Workbook();

  // Sheet 1: All Articles
  const sheet1 = workbook.addWorksheet("Articles");
  sheet1.columns = [
    { header: "Title", key: "title", width: 40 },
    { header: "URL", key: "url", width: 50 },
    { header: "Domain", key: "domain", width: 20 },
    { header: "Word Count", key: "word_count", width: 12 },
    { header: "Relevant", key: "is_relevant", width: 10 },
    { header: "Duplicate", key: "is_duplicate", width: 10 },
    { header: "Kept", key: "is_kept", width: 10 },
    { header: "Shortlisted", key: "is_shortlisted", width: 12 },
    { header: "Category", key: "category", width: 25 },
    { header: "Score", key: "score", width: 8 },
    { header: "Tier", key: "tier", width: 12 },
    { header: "Suggested Header", key: "suggested_header", width: 40 },
    { header: "Rationale", key: "rationale", width: 60 },
  ];

  for (const a of articles) {
    sheet1.addRow({
      title: a.title || "",
      url: a.url,
      domain: a.domain || "",
      word_count: a.word_count || 0,
      is_relevant: a.is_relevant ? "Yes" : "No",
      is_duplicate: a.is_duplicate ? "Yes" : "No",
      is_kept: a.is_kept ? "Yes" : "No",
      is_shortlisted: a.is_shortlisted ? "Yes" : "No",
      category: a.ranking?.category || "",
      score: a.ranking?.score || "",
      tier: a.ranking?.tier || "",
      suggested_header: a.ranking?.suggested_header || "",
      rationale: a.ranking?.rationale || "",
    });
  }

  // Sheet 2: Summaries (shortlisted only)
  const sheet2 = workbook.addWorksheet("Summaries");
  sheet2.columns = [
    { header: "Title", key: "title", width: 40 },
    { header: "Tier", key: "tier", width: 12 },
    { header: "Score", key: "score", width: 8 },
    { header: "Summary", key: "summary", width: 80 },
    { header: "Why It Matters", key: "why_it_matters", width: 80 },
    { header: "Implications", key: "implications", width: 60 },
    { header: "URL", key: "url", width: 50 },
  ];

  const summarised = articles.filter((a) => a.summary);
  for (const a of summarised) {
    sheet2.addRow({
      title: a.title || "",
      tier: a.ranking?.tier || "",
      score: a.ranking?.score || "",
      summary: a.summary?.summary_text || "",
      why_it_matters: a.summary?.why_it_matters?.join(" | ") || "",
      implications: a.summary?.implications || "",
      url: a.url,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
