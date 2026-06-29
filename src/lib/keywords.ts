// Free-form recipe tags. Kept deliberately small and tidy so the tag cloud stays
// readable and the GIN index stays cheap.

export const MAX_KEYWORDS = 8;
export const MAX_KEYWORD_LEN = 30;

/**
 * Normalize free-form keyword input into a clean, deduped tag list: lowercased,
 * trimmed, inner whitespace collapsed, punctuation/emoji stripped (letters,
 * numbers, spaces and hyphens kept), then capped in length and count. Accepts a
 * comma-separated string or an array, so it works for both form input and JSON.
 */
export function normalizeKeywords(input: unknown): string[] {
  const raw = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(",")
      : [];

  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const kw = String(item)
      .toLowerCase()
      .replace(/[^\p{L}\p{N} -]/gu, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_KEYWORD_LEN)
      .trim();
    if (!kw || seen.has(kw)) continue;
    seen.add(kw);
    out.push(kw);
    if (out.length >= MAX_KEYWORDS) break;
  }
  return out;
}
