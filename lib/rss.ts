import { DOMParser } from "linkedom";

export interface RssItem {
  url: string;
  title: string;
  publishDate: string | null;
}

export function isRssFeed(text: string): boolean {
  const trimmed = text.trimStart().slice(0, 500);
  return /<rss[\s>]/i.test(trimmed) || /<feed[\s>]/i.test(trimmed);
}

export function parseRss(xmlText: string): RssItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");
  const items: RssItem[] = [];

  // RSS 2.0 (<item>)
  const rssItems = doc.querySelectorAll("item");
  for (const item of rssItems) {
    const link = item.querySelector("link")?.textContent?.trim();
    const title = item.querySelector("title")?.textContent?.trim() || "";
    const pubDate = item.querySelector("pubDate")?.textContent?.trim() || null;
    if (link) {
      items.push({ url: link, title, publishDate: pubDate });
    }
  }

  // Atom (<entry>) — only if no RSS items found
  if (items.length === 0) {
    const entries = doc.querySelectorAll("entry");
    for (const entry of entries) {
      const linkEl =
        entry.querySelector('link[rel="alternate"]') ||
        entry.querySelector("link");
      const href = linkEl?.getAttribute("href");
      const title = entry.querySelector("title")?.textContent?.trim() || "";
      const published =
        entry.querySelector("published")?.textContent?.trim() ||
        entry.querySelector("updated")?.textContent?.trim() ||
        null;
      if (href) {
        items.push({ url: href, title, publishDate: published });
      }
    }
  }

  return items;
}
