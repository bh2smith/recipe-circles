import { notFound } from "next/navigation";
import { getSessionAddress } from "@/lib/session";
import { getRecipe, listComments } from "@/lib/data";
import { RecipeView } from "@/components/recipe-view";
import { CommentFeed } from "@/components/comment-feed";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function RecipePage({ params }: Props) {
  const { id } = await params;
  const viewer = await getSessionAddress();
  const recipe = await getRecipe(id, viewer);
  if (!recipe) notFound();
  const comments = await listComments(id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <RecipeView recipe={recipe} />
      <CommentFeed recipeId={id} initialComments={comments} />
    </div>
  );
}
