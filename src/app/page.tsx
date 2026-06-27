import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSessionAddress } from "@/lib/session";
import { listRecipes } from "@/lib/data";
import { RecipeCard } from "@/components/recipe-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const viewer = await getSessionAddress();
  const recipes = await listRecipes(viewer);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <section className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          A community cookbook on Circles
        </h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Share what you cook, talk recipes in the comments, and let chefs charge
          a little gCRC to unlock their best dishes.
        </p>
      </section>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-16 text-center">
          <UtensilsCrossed className="size-10 text-muted-foreground" />
          <div>
            <p className="font-heading text-lg font-medium">No recipes yet</p>
            <p className="text-sm text-muted-foreground">
              Be the first to share something delicious.
            </p>
          </div>
          <Link
            href="/create"
            className={cn(buttonVariants(), "rounded-full")}
          >
            Post a recipe
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}
    </div>
  );
}
