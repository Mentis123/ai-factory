import { prisma } from "@/lib/db";
import { fetchHtml, extractContent } from "@/lib/crawl";
import { normalizeUrl } from "@/lib/utils/urls";
import { titleSimilarity, DUPLICATE_THRESHOLD } from "@/lib/utils/similarity";
import { generateJson } from "@/lib/gemini";
import { loadPrompt, fillTemplate } from "@/lib/utils/prompts";
import { withPhaseGuard, type PhaseResult } from "./helpers";
import { z } from "zod";
import pLimit from "p-limit";

const fetchLimit = pLimit(5);
const geminiLimit = pLimit(3);

const RelevancySchema = z.object({
  is_relevant: z.boolean(),
  reason: z.string(),
});

export async function grabArticles(runId: string): Promise<PhaseResult> {
  return withPhaseGuard(runId, "grab_articles", async (logs) => {
    const run = await prisma.run.findUniqueOrThrow({ where: { id: runId } });
    const articles = await prisma.article.findMany({
      where: { run_id: runId, is_fetched: false },
    });

    logs.push(`Fetching content for ${articles.length} articles...`);

    // Step 1: Fetch and extract content
    let fetched = 0;
    let fetchFailed = 0;

    await Promise.allSettled(
      articles.map((article) =>
        fetchLimit(async () => {
          try {
            const html = await fetchHtml(article.url);
            const content = extractContent(html, article.url);

            await prisma.article.update({
              where: { id: article.id },
              data: {
                title: content.title || article.title,
                content_text: content.textContent,
                word_count: content.textContent.split(/\s+/).length,
                publish_date: content.publishDate
                  ? new Date(content.publishDate)
                  : null,
                canonical_url: content.canonicalUrl
                  ? normalizeUrl(content.canonicalUrl)
                  : null,
                is_fetched: true,
              },
            });
            fetched++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logs.push(`Fetch failed: ${article.url} — ${msg}`);
            await prisma.article.update({
              where: { id: article.id },
              data: { is_fetched: true, is_kept: false },
            });
            fetchFailed++;
          }
        })
      )
    );

    logs.push(`Fetched: ${fetched}, Failed: ${fetchFailed}`);

    // Step 2: Relevancy check via Gemini
    const fetchedArticles = await prisma.article.findMany({
      where: {
        run_id: runId,
        is_fetched: true,
        is_kept: true,
        content_text: { not: null },
        is_relevant: null,
      },
    });

    logs.push(
      `Running relevancy check on ${fetchedArticles.length} articles...`
    );

    const systemPrompt = loadPrompt("relevancy_check_system.txt");
    const userTemplate = loadPrompt("relevancy_check_user.txt");
    let relevant = 0;
    let irrelevant = 0;

    await Promise.allSettled(
      fetchedArticles.map((article) =>
        geminiLimit(async () => {
          try {
            const contentPreview = (article.content_text || "").slice(0, 2000);
            const userPrompt = fillTemplate(userTemplate, {
              TOPIC: run.prompt_topic,
              KEYWORDS: run.keywords.join(", "),
              TITLE: article.title || "(untitled)",
              CONTENT_PREVIEW: contentPreview,
            });

            const result = await generateJson(
              systemPrompt,
              userPrompt,
              RelevancySchema
            );

            await prisma.article.update({
              where: { id: article.id },
              data: { is_relevant: result.is_relevant },
            });

            if (result.is_relevant) relevant++;
            else irrelevant++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logs.push(
              `Relevancy check failed for "${article.title}" — ${msg}`
            );
            // Default to relevant on failure so we don't lose articles
            await prisma.article.update({
              where: { id: article.id },
              data: { is_relevant: true },
            });
            relevant++;
          }
        })
      )
    );

    logs.push(`Relevant: ${relevant}, Irrelevant: ${irrelevant}`);

    // Step 3: Deduplication
    const candidateArticles = await prisma.article.findMany({
      where: {
        run_id: runId,
        is_fetched: true,
        is_relevant: true,
        is_kept: true,
      },
    });

    logs.push(`Deduplicating ${candidateArticles.length} articles...`);
    let dupCount = 0;

    // Dedupe by canonical URL
    const canonicalGroups = new Map<string, typeof candidateArticles>();
    for (const art of candidateArticles) {
      const key = art.canonical_url || art.url;
      const group = canonicalGroups.get(key) || [];
      group.push(art);
      canonicalGroups.set(key, group);
    }

    const dupeIds = new Set<string>();
    for (const group of canonicalGroups.values()) {
      if (group.length > 1) {
        // Keep the first, mark rest as duplicates
        for (let i = 1; i < group.length; i++) {
          dupeIds.add(group[i].id);
          await prisma.article.update({
            where: { id: group[i].id },
            data: { is_duplicate: true, duplicate_of_id: group[0].id },
          });
          dupCount++;
        }
      }
    }

    // Title similarity dedup (among non-duplicates)
    const remaining = candidateArticles.filter((a) => !dupeIds.has(a.id));
    for (let i = 0; i < remaining.length; i++) {
      if (dupeIds.has(remaining[i].id)) continue;
      for (let j = i + 1; j < remaining.length; j++) {
        if (dupeIds.has(remaining[j].id)) continue;
        const titleA = remaining[i].title || "";
        const titleB = remaining[j].title || "";
        if (
          titleA &&
          titleB &&
          titleSimilarity(titleA, titleB) > DUPLICATE_THRESHOLD
        ) {
          dupeIds.add(remaining[j].id);
          await prisma.article.update({
            where: { id: remaining[j].id },
            data: { is_duplicate: true, duplicate_of_id: remaining[i].id },
          });
          dupCount++;
        }
      }
    }

    logs.push(`Duplicates found: ${dupCount}`);
    logs.push("Grab articles phase complete.");
  });
}
