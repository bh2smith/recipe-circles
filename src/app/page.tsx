import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSessionAddress } from "@/lib/session";
import { listAllKeywords, listRecipes } from "@/lib/data";
import { RecipeCard } from "@/components/recipe-card";
import { KeywordBar } from "@/components/keyword-bar";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string }>;
}) {
  const { keyword: rawKeyword } = await searchParams;
  const keyword = rawKeyword?.trim().toLowerCase() || undefined;

  const viewer = await getSessionAddress();
  const [recipes, keywords] = await Promise.all([
    listRecipes(viewer, { keyword }),
    listAllKeywords(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {keyword ? (
        <section className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Tagged <span className="text-primary">{keyword}</span>
          </h1>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-full",
            )}
          >
            Clear filter
          </Link>
        </section>
      ) : (
        <section className="mb-8">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Cook it. Share it. Get paid for it.
          </h1>
          <p className="mt-2 max-w-prose text-muted-foreground">
            A community cookbook on Circles. Share what you cook, talk recipes
            in the comments, and charge a little gCRC to unlock your best dishes.
          </p>
        </section>
      )}

      <KeywordBar keywords={keywords} active={keyword} />

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-16 text-center">
          <UtensilsCrossed className="size-10 text-muted-foreground" />
          <div>
            {keyword ? (
              <>
                <p className="font-heading text-lg font-medium">
                  No recipes tagged “{keyword}”
                </p>
                <p className="text-sm text-muted-foreground">
                  Try another keyword or clear the filter.
                </p>
              </>
            ) : (
              <>
                <p className="font-heading text-lg font-medium">
                  No recipes yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Be the first to share something delicious.
                </p>
              </>
            )}
          </div>
          <Link
            href={keyword ? "/" : "/create"}
            className={cn(buttonVariants(), "rounded-full")}
          >
            {keyword ? "Browse all recipes" : "Post a recipe"}
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
