"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Lock, Trash2 } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RecipeBody } from "@/components/recipe-body";
import { useWallet } from "@/components/wallet-provider";
import { buildErc20Transfer, formatCrc, shortAddress } from "@/lib/circles";
import { getTokenBalanceAtto } from "@/lib/circles-rpc";
import { GCRC_CONFIGURED, GCRC_ERC20_ADDRESS } from "@/lib/config";
import type { RecipeDTO } from "@/lib/data";

export function RecipeView({ recipe }: { recipe: RecipeDTO }) {
  const router = useRouter();
  const { address, session, ensureSession, sendTransactions } = useWallet();
  const [unlocking, setUnlocking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const price = BigInt(recipe.priceAtto);
  const authorLabel = recipe.authorName ?? shortAddress(recipe.authorAddress);

  async function handleUnlock() {
    setUnlocking(true);
    try {
      if (!address) {
        toast.error("Connect your Circles account", {
          description: "Use the panel in the bottom-right corner.",
        });
        return;
      }
      const me = session ?? (await ensureSession());
      if (!me) {
        toast.error("Sign in to unlock");
        return;
      }
      if (!GCRC_CONFIGURED) {
        toast.error("gCRC payments aren't configured yet");
        return;
      }

      const balance = await getTokenBalanceAtto(
        address,
        GCRC_ERC20_ADDRESS,
      ).catch(() => 0n);
      if (balance < price) {
        toast.error("Not enough gCRC", {
          description:
            "Wrap or mint gCRC in the Circles app, then come back and try again.",
        });
        return;
      }

      const tx = buildErc20Transfer(
        GCRC_ERC20_ADDRESS,
        recipe.authorAddress,
        price,
      );
      toast.loading("Confirm the payment in the Circles popup…", { id: "pay" });
      const [txHash] = await sendTransactions([tx]);

      toast.loading("Verifying payment on Gnosis Chain…", { id: "pay" });
      const res = await fetch(`/api/recipes/${recipe.id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? "Unlock failed");
      }
      toast.success("Unlocked — enjoy the recipe!", { id: "pay" });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unlock failed", {
        id: "pay",
      });
    } finally {
      setUnlocking(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this recipe? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Recipe deleted");
      router.push("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <article className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All recipes
      </Link>

      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {recipe.title}
          </h1>
          {recipe.free ? (
            <Badge variant="secondary" className="shrink-0">
              Free
            </Badge>
          ) : (
            <Badge className="shrink-0 gap-1 border-transparent bg-salmon text-salmon-foreground">
              {recipe.locked ? <Lock className="size-3" /> : null}
              <span className="font-mono tabular-nums">
                {formatCrc(recipe.priceAtto)}
              </span>{" "}
              gCRC
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="size-6">
              {recipe.authorAvatar ? (
                <AvatarImage src={recipe.authorAvatar} alt="" />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {authorLabel.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {authorLabel}
            {recipe.isAuthor ? (
              <Badge variant="outline" className="ml-1">
                You
              </Badge>
            ) : null}
          </span>
          {recipe.isAuthor ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </Button>
          ) : null}
        </div>
      </header>

      {recipe.body !== null ? (
        <RecipeBody content={recipe.body} />
      ) : (
        <div className="space-y-4">
          {recipe.teaser ? (
            <p className="text-muted-foreground">{recipe.teaser}</p>
          ) : null}
          <Card className="items-center gap-4 border-primary/30 bg-accent/40 p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-salmon/10 text-salmon">
              <Lock className="size-6" />
            </span>
            <div>
              <p className="font-heading text-lg font-semibold">
                Unlock this recipe
              </p>
              <p className="text-sm text-muted-foreground">
                Pay{" "}
                <span className="font-mono tabular-nums text-foreground">
                  {formatCrc(recipe.priceAtto)} gCRC
                </span>{" "}
                to {authorLabel} to read the full recipe.
              </p>
            </div>
            <Button
              size="lg"
              className="rounded-full bg-salmon text-salmon-foreground hover:bg-salmon/90"
              onClick={handleUnlock}
              disabled={unlocking}
            >
              {unlocking ? (
                <>
                  <Loader2 className="mr-1 size-4 animate-spin" /> Working…
                </>
              ) : (
                <>
                  Unlock for{" "}
                  <span className="font-mono tabular-nums">
                    {formatCrc(recipe.priceAtto)} gCRC
                  </span>
                </>
              )}
            </Button>
          </Card>
        </div>
      )}
    </article>
  );
}
