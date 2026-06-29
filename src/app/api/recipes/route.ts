import { NextResponse } from "next/server";
import { getSessionAddress } from "@/lib/session";
import { createRecipe, listRecipes } from "@/lib/data";
import { parseRecipeInput } from "@/lib/recipe-input";

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

  const parsed = parseRecipeInput(await req.json().catch(() => ({})));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const id = await createRecipe({ authorAddress: viewer, ...parsed.data });
  return NextResponse.json({ id }, { status: 201 });
}
