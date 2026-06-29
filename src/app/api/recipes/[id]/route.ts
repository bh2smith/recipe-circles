import { NextResponse } from "next/server";
import { getSessionAddress } from "@/lib/session";
import {
  deleteRecipe,
  getRecipe,
  getRecipeRaw,
  updateRecipe,
} from "@/lib/data";
import { parseRecipeInput } from "@/lib/recipe-input";

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

export async function PATCH(req: Request, { params }: Ctx) {
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

  const parsed = parseRecipeInput(await req.json().catch(() => ({})));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  await updateRecipe(id, parsed.data);
  return NextResponse.json({ id });
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
