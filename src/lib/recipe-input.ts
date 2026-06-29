import { parseUnits } from "viem";
import { normalizeKeywords } from "@/lib/keywords";

export interface ParsedRecipe {
  title: string;
  body: string;
  teaser: string | null;
  keywords: string[];
  priceAtto: string;
}

/**
 * Validate and normalize a recipe request body, shared by create (POST) and
 * edit (PATCH). Returns the cleaned fields or a user-facing error message.
 */
export function parseRecipeInput(
  input: unknown,
): { ok: true; data: ParsedRecipe } | { ok: false; error: string } {
  const b = (input ?? {}) as Record<string, unknown>;
  const title = String(b.title ?? "").trim();
  const body = String(b.body ?? "").trim();
  const teaser = b.teaser ? String(b.teaser).trim().slice(0, 500) : null;
  const keywords = normalizeKeywords(b.keywords);

  if (!title || title.length > 200) {
    return { ok: false, error: "Title is required (≤200 characters)" };
  }
  if (!body) {
    return { ok: false, error: "Recipe body is required" };
  }

  let priceAtto: string;
  try {
    priceAtto = b.price ? parseUnits(String(b.price), 18).toString() : "0";
    if (BigInt(priceAtto) < 0n) throw new Error("negative");
  } catch {
    return { ok: false, error: "Invalid price" };
  }

  return { ok: true, data: { title, body, teaser, keywords, priceAtto } };
}
