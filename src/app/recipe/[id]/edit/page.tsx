import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getRecipe } from "@/lib/data";
import { getSessionAddress } from "@/lib/session";
import { RecipeForm } from "@/components/recipe-form";

export const dynamic = "force-dynamic";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await getSessionAddress();
  const recipe = await getRecipe(id, viewer);

  if (!recipe) notFound();
  // Only the author may edit; the API enforces this too (defense in depth).
  if (!recipe.isAuthor) redirect(`/recipe/${id}`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/recipe/${id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to recipe
      </Link>
      <h1 className="mb-2 font-heading text-3xl font-semibold tracking-tight">
        Edit recipe
      </h1>
      <p className="mb-8 text-muted-foreground">
        Update your recipe — changes go live right away.
      </p>
      <RecipeForm recipe={recipe} />
    </div>
  );
}
