import { escapeHtml } from "@/lib/html";

export interface UrlAsset {
  kind: string;
  text?: string | null;
  url?: string;
  sourceUrl?: string;
}

/**
 * After persistence, rewrite any provider URL embedded in a text asset (e.g. the
 * Website Builder's HTML) to its durable R2 URL, so embedded images don't expire
 * when the provider's temporary URL does.
 *
 * Embedded URLs appear HTML-escaped inside the HTML (e.g. `&` → `&amp;`), so we
 * replace BOTH the raw form (plain-text assets) and the escaped form (HTML).
 * No-op when nothing was persisted (sourceUrl === url).
 */
export function rewriteEmbeddedUrls<T extends UrlAsset>(assets: T[]): T[] {
  const pairs: [string, string][] = [];
  for (const a of assets) {
    if (a.sourceUrl && a.url && a.sourceUrl !== a.url) {
      pairs.push([a.sourceUrl, a.url]);
      const escapedFrom = escapeHtml(a.sourceUrl);
      const escapedTo = escapeHtml(a.url);
      if (escapedFrom !== a.sourceUrl) pairs.push([escapedFrom, escapedTo]);
    }
  }
  if (pairs.length === 0) return assets;

  return assets.map((a) => {
    if (a.kind !== "text" || !a.text) return a;
    let text = a.text;
    for (const [from, to] of pairs) text = text.split(from).join(to);
    return { ...a, text };
  });
}
