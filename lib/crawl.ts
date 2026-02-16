import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";

export interface ExtractedContent {
  title: string;
  textContent: string;
  publishDate: string | null;
  canonicalUrl: string | null;
}

export async function fetchHtml(
  url: string,
  timeoutMs = 8000
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AIFactoryBot/1.0; +https://gaiinsights.com)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export function extractContent(html: string, url: string): ExtractedContent {
  // Inject <base> tag so relative URLs resolve correctly (linkedom has no url option)
  const htmlWithBase = html.includes("<base")
    ? html
    : html.replace(/(<head[^>]*>)/i, `$1<base href="${url}">`);
  const { document: doc } = parseHTML(htmlWithBase);

  const canonicalEl = doc.querySelector('link[rel="canonical"]');
  const canonicalUrl = canonicalEl?.getAttribute("href") || null;

  const publishDate = extractPublishDate(doc);

  const reader = new Readability(doc);
  const article = reader.parse();

  return {
    title: article?.title || doc.title || "",
    textContent: article?.textContent?.trim() || "",
    publishDate,
    canonicalUrl,
  };
}

export function extractLinks(html: string, baseUrl: string): string[] {
  const { document: doc } = parseHTML(html);
  const links: string[] = [];
  const seen = new Set<string>();

  doc.querySelectorAll("a[href]").forEach((a) => {
    try {
      const href = a.getAttribute("href");
      if (!href) return;
      const resolved = new URL(href, baseUrl).href;

      // Filter: must be http(s), not same as base, path depth > 1, not obvious nav
      if (!resolved.startsWith("http")) return;
      const pathname = new URL(resolved).pathname;
      if (pathname === "/" || pathname === "") return;

      // Heuristic: likely article if path has multiple segments
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length < 2) return;

      // Skip common non-article patterns
      if (/\/(tag|category|author|page|search|login|signup|about|contact|privacy|terms)\//i.test(pathname)) return;
      // Skip file downloads
      if (/\.(pdf|zip|png|jpg|gif|mp4|mp3)$/i.test(pathname)) return;

      if (!seen.has(resolved)) {
        seen.add(resolved);
        links.push(resolved);
      }
    } catch {
      // invalid URL, skip
    }
  });

  return links;
}

function extractPublishDate(doc: Document): string | null {
  // Try meta tags in order of preference
  const metaSelectors = [
    'meta[property="article:published_time"]',
    'meta[name="article:published_time"]',
    'meta[property="og:article:published_time"]',
    'meta[name="datePublished"]',
    'meta[property="datePublished"]',
    'meta[name="date"]',
    'meta[name="DC.date.issued"]',
    'meta[property="article:modified_time"]',
  ];

  for (const selector of metaSelectors) {
    const el = doc.querySelector(selector);
    const content = el?.getAttribute("content");
    if (content) return content;
  }

  // Try JSON-LD
  const jsonLdEls = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const el of jsonLdEls) {
    try {
      const data = JSON.parse(el.textContent || "");
      if (data.datePublished) return data.datePublished;
      if (data["@graph"]) {
        for (const item of data["@graph"]) {
          if (item.datePublished) return item.datePublished;
        }
      }
    } catch {
      // invalid JSON-LD, skip
    }
  }

  // Try <time> elements
  const timeEl = doc.querySelector("time[datetime]");
  if (timeEl) return timeEl.getAttribute("datetime");

  return null;
}
