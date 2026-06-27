import { NextResponse } from "next/server";
import { getSessionAddress } from "@/lib/session";
import { deleteRecipe, getRecipe, getRecipeRaw } from "@/lib/data";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const viewer = await getSessionAddress();
  const recipe = await getRecipe(id, viewer);
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }
  return NextResponse.json({ recipe });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const viewer = await getSessionAddress();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = await getRecipeRaw(id);
  if (!raw) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }
  if (raw.authorAddress !== viewer) {
    return NextResponse.json({ error: "Not your recipe" }, { status: 403 });
  }
  await deleteRecipe(id);
  return NextResponse.json({ ok: true });
}
