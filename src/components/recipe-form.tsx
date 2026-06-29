"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/components/wallet-provider";
import { GCRC_CONFIGURED } from "@/lib/config";
import { attoToCrc } from "@/lib/circles";
import { MAX_KEYWORDS, normalizeKeywords } from "@/lib/keywords";
import type { RecipeDTO } from "@/lib/data";

/** Create a new recipe, or edit an existing one when `recipe` is provided. */
export function RecipeForm({ recipe }: { recipe?: RecipeDTO }) {
  const editing = !!recipe;
  const router = useRouter();
  const { address, session, ensureSession } = useWallet();
  const [title, setTitle] = useState(recipe?.title ?? "");
  const [teaser, setTeaser] = useState(recipe?.teaser ?? "");
  const [body, setBody] = useState(recipe?.body ?? "");
  const [keywords, setKeywords] = useState(recipe?.keywords.join(", ") ?? "");
  const [price, setPrice] = useState(
    recipe ? attoToCrc(recipe.priceAtto) : "0",
  );
  const [submitting, setSubmitting] = useState(false);

  const paid = Number(price) > 0;
  const parsedKeywords = normalizeKeywords(keywords);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("A title and the recipe itself are required");
      return;
    }
    setSubmitting(true);
    try {
      if (!address) {
        toast.error("Connect your Circles account first", {
          description: "Use the panel in the bottom-right corner.",
        });
        return;
      }
      const me = session ?? (await ensureSession());
      if (!me) {
        toast.error("Sign in to continue");
        return;
      }
      const res = await fetch(
        editing ? `/api/recipes/${recipe.id}` : "/api/recipes",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            teaser,
            body,
            keywords: parsedKeywords,
            price,
          }),
        },
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(
          e.error ??
            (editing ? "Could not save changes" : "Could not post recipe"),
        );
      }
      const { id } = await res.json();
      toast.success(editing ? "Recipe updated!" : "Recipe posted!");
      router.push(`/recipe/${id}`);
      router.refresh();
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : editing
            ? "Could not save changes"
            : "Could not post recipe",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Grandma's sourdough focaccia"
          maxLength={200}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="teaser">
          Teaser{" "}
          <span className="font-normal text-muted-foreground">
            (optional — shown before unlocking)
          </span>
        </Label>
        <Input
          id="teaser"
          value={teaser}
          onChange={(e) => setTeaser(e.target.value)}
          placeholder="Crispy edges, pillowy middle, almost no kneading."
          maxLength={500}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Recipe</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            "Ingredients\n- 500g flour\n- ...\n\nMethod\n1. ...\n2. ..."
          }
          rows={14}
          required
        />
        <p className="text-xs text-muted-foreground">
          Markdown supported — write <code>[text](https://…)</code> to link
          (e.g. to another recipe), or just paste a URL. Lists, headings and{" "}
          <code>**bold**</code> work too.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="keywords">
          Keywords{" "}
          <span className="font-normal text-muted-foreground">
            (optional — comma-separated, for browsing)
          </span>
        </Label>
        <Input
          id="keywords"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="vegan, dessert, 30-min"
        />
        {parsedKeywords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {parsedKeywords.map((kw) => (
              <Badge key={kw} variant="secondary" className="font-normal">
                {kw}
              </Badge>
            ))}
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Up to {MAX_KEYWORDS} tags. Readers can browse recipes by tag.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Unlock price</Label>
        <div className="flex items-center gap-2">
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="max-w-[160px]"
          />
          <span className="text-sm text-muted-foreground">gCRC</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Set <strong>0</strong> for a free recipe. Paid recipes show only the
          teaser until a reader pays you in gCRC.
        </p>
        {paid && !GCRC_CONFIGURED ? (
          <p className="text-xs text-destructive">
            Heads up: gCRC isn&apos;t configured on this deployment yet, so paid
            recipes can&apos;t be unlocked until it is.
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={submitting} className="rounded-full">
        {submitting ? (
          <>
            <Loader2 className="mr-1 size-4 animate-spin" />{" "}
            {editing ? "Saving…" : "Posting…"}
          </>
        ) : editing ? (
          "Save changes"
        ) : (
          "Post recipe"
        )}
      </Button>
    </form>
  );
}
