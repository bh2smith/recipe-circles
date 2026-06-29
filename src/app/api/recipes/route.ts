import { NextResponse } from "next/server";
import { parseUnits } from "viem";
import { getSessionAddress } from "@/lib/session";
import { createRecipe, listRecipes } from "@/lib/data";
import { normalizeKeywords } from "@/lib/keywords";

export async function GET(req: Request) {
  const viewer = await getSessionAddress();
  const keyword = new URL(req.url).searchParams.get("keyword") ?? undefined;
  const recipes = await listRecipes(viewer, { keyword });
  return NextResponse.json({ recipes });
}

export async function POST(req: Request) {
  const viewer = await getSessionAddress();
  if (!viewer) {
    return NextResponse.json({ error: "Sign in to post" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const content = String(body.body ?? "").trim();
  const teaser = body.teaser ? String(body.teaser).trim().slice(0, 500) : null;
  const keywords = normalizeKeywords(body.keywords);

  if (!title || title.length > 200) {
    return NextResponse.json(
      { error: "Title is required (≤200 characters)" },
      { status: 400 },
    );
  }
  if (!content) {
    return NextResponse.json({ error: "Recipe body is required" }, { status: 400 });
  }

  let priceAtto: string;
  try {
    priceAtto = body.price ? parseUnits(String(body.price), 18).toString() : "0";
    if (BigInt(priceAtto) < 0n) throw new Error("negative");
  } catch {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  const id = await createRecipe({
    authorAddress: viewer,
    title,
    body: content,
    teaser,
    keywords,
    priceAtto,
  });
  return NextResponse.json({ id }, { status: 201 });
}
