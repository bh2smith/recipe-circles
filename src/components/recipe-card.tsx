import Link from "next/link";
import { Lock, MessageCircle } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCrc, shortAddress } from "@/lib/circles";
import type { RecipeDTO } from "@/lib/data";

export function RecipeCard({ recipe }: { recipe: RecipeDTO }) {
  const authorLabel = recipe.authorName ?? shortAddress(recipe.authorAddress);
  const preview = recipe.teaser ?? recipe.body ?? "";

  return (
    <Link href={`/recipe/${recipe.id}`} className="block">
      <Card className="gap-3 p-5 transition-colors hover:border-primary/40 hover:bg-accent/30">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-xl font-semibold leading-snug">
            {recipe.title}
          </h3>
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

        {preview ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{preview}</p>
        ) : null}

        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <Avatar className="size-5">
              {recipe.authorAvatar ? (
                <AvatarImage src={recipe.authorAvatar} alt="" />
              ) : null}
              <AvatarFallback className="text-[9px]">
                {authorLabel.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {authorLabel}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="size-3.5" />
            {recipe.commentCount}
          </span>
        </div>
      </Card>
    </Link>
  );
}
