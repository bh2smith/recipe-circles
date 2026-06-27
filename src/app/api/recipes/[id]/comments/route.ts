import { NextResponse } from "next/server";
import { getSessionAddress } from "@/lib/session";
import { addComment, getRecipeRaw, listComments } from "@/lib/data";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const comments = await listComments(id);
  return NextResponse.json({ comments });
}

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const viewer = await getSessionAddress();
  if (!viewer) {
    return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });
  }
  const { body } = await req.json().catch(() => ({}));
  const text = String(body ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  const recipe = await getRecipeRaw(id);
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const comment = await addComment(id, viewer, text.slice(0, 2000));
  return NextResponse.json({ comment }, { status: 201 });
}
