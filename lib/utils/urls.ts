const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
  "_ga",
  "_gl",
  "hsCtaTracking",
  "mkt_tok",
]);

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);

    // Force https
    u.protocol = "https:";

    // Strip www
    u.hostname = u.hostname.replace(/^www\./, "");

    // Remove tracking params
    for (const param of [...u.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(param)) {
        u.searchParams.delete(param);
      }
    }

    // Sort remaining params for consistency
    u.searchParams.sort();

    // Strip trailing slash
    let path = u.pathname;
    if (path.length > 1 && path.endsWith("/")) {
      path = path.slice(0, -1);
    }

    // Strip hash
    return `${u.protocol}//${u.hostname}${path}${u.search}`;
  } catch {
    return url;
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
