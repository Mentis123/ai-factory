import { prisma } from "@/lib/db";
import { fetchHtml, extractLinks } from "@/lib/crawl";
import { isRssFeed, parseRss } from "@/lib/rss";
import { normalizeUrl, extractDomain } from "@/lib/utils/urls";
import { withPhaseGuard, type PhaseResult } from "./helpers";
import pLimit from "p-limit";

const limit = pLimit(5);

export async function sourceArticles(runId: string): Promise<PhaseResult> {
  return withPhaseGuard(runId, "source_articles", async (logs) => {
    const run = await prisma.run.findUniqueOrThrow({ where: { id: runId } });

    const seen = new Set<string>();
    const articlesToCreate: {
      url: string;
      title: string | null;
      source_url: string | null;
      domain: string;
    }[] = [];

    function addArticle(
      rawUrl: string,
      title: string | null,
      sourceUrl: string | null
    ) {
      const normalized = normalizeUrl(rawUrl);
      if (seen.has(normalized)) return;
      seen.add(normalized);
      articlesToCreate.push({
        url: normalized,
        title,
        source_url: sourceUrl,
        domain: extractDomain(rawUrl),
      });
    }

    // If specific_urls provided, add them directly
    if (run.specific_urls.length > 0) {
      logs.push(
        `Adding ${run.specific_urls.length} specific URLs directly as articles.`
      );
      for (const url of run.specific_urls) {
        addArticle(url, null, null);
      }
    } else {
      // Process source_urls
      const sourceUrls = run.source_urls;
      logs.push(`Processing ${sourceUrls.length} source URLs...`);

      const results = await Promise.allSettled(
        sourceUrls.map((sourceUrl) =>
          limit(async () => {
            try {
              const html = await fetchHtml(sourceUrl);

              if (isRssFeed(html)) {
                const items = parseRss(html);
                logs.push(
                  `RSS: ${sourceUrl} → ${items.length} items`
                );
                for (const item of items) {
                  addArticle(item.url, item.title, sourceUrl);
                }
              } else {
                const links = extractLinks(html, sourceUrl);
                logs.push(
                  `HTML: ${sourceUrl} → ${links.length} links extracted`
                );
                for (const link of links) {
                  addArticle(link, null, sourceUrl);
                }
              }
            } catch (err) {
              const msg =
                err instanceof Error ? err.message : String(err);
              logs.push(`FAILED: ${sourceUrl} — ${msg}`);
            }
          })
        )
      );

      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) logs.push(`${failed} source URLs failed to fetch.`);
    }

    // Bulk create articles
    if (articlesToCreate.length > 0) {
      await prisma.article.createMany({
        data: articlesToCreate.map((a) => ({
          run_id: runId,
          url: a.url,
          title: a.title,
          source_url: a.source_url,
          domain: a.domain,
        })),
        skipDuplicates: true,
      });
    }

    logs.push(`Total discovered articles: ${articlesToCreate.length}`);
  });
}
