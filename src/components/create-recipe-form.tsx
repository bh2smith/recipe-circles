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
import { MAX_KEYWORDS, normalizeKeywords } from "@/lib/keywords";

export function CreateRecipeForm() {
  const router = useRouter();
  const { address, session, ensureSession } = useWallet();
  const [title, setTitle] = useState("");
  const [teaser, setTeaser] = useState("");
  const [body, setBody] = useState("");
  const [keywords, setKeywords] = useState("");
  const [price, setPrice] = useState("0");
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
        toast.error("Sign in to post");
        return;
      }
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          teaser,
          body,
          keywords: parsedKeywords,
          price,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? "Could not post recipe");
      }
      const { id } = await res.json();
      toast.success("Recipe posted!");
      router.push(`/recipe/${id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post recipe");
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
            <Loader2 className="mr-1 size-4 animate-spin" /> Posting…
          </>
        ) : (
          "Post recipe"
        )}
      </Button>
    </form>
  );
}
