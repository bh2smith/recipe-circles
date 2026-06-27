"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, MessageCircle, Send } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useWallet } from "@/components/wallet-provider";
import { shortAddress } from "@/lib/circles";
import type { CommentDTO } from "@/lib/data";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function CommentFeed({
  recipeId,
  initialComments,
}: {
  recipeId: string;
  initialComments: CommentDTO[];
}) {
  const { address, session, ensureSession, profile } = useWallet();
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setPosting(true);
    try {
      if (!address) {
        toast.error("Connect your Circles account to comment");
        return;
      }
      const me = session ?? (await ensureSession());
      if (!me) {
        toast.error("Sign in to comment");
        return;
      }
      const res = await fetch(`/api/recipes/${recipeId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? "Could not post comment");
      }
      const { comment } = await res.json();
      setComments((c) => [
        ...c,
        {
          ...comment,
          authorName: profile?.name ?? null,
          authorAvatar: profile?.previewImageUrl ?? null,
        },
      ]);
      setText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post comment");
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="mt-10">
      <Separator className="mb-6" />
      <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-semibold">
        <MessageCircle className="size-5" />
        Comments
        <span className="text-sm font-normal text-muted-foreground">
          ({comments.length})
        </span>
      </h2>

      <form onSubmit={submit} className="mb-6 space-y-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share a tip, a question, or how it turned out…"
          rows={3}
          maxLength={2000}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={posting || !text.trim()}>
            {posting ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <Send className="mr-1 size-4" />
            )}
            Post
          </Button>
        </div>
      </form>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No comments yet. Start the conversation.
        </p>
      ) : (
        <ul className="space-y-5">
          {comments.map((c) => {
            const label = c.authorName ?? shortAddress(c.authorAddress);
            return (
              <li key={c.id} className="flex gap-3">
                <Avatar className="size-8">
                  {c.authorAvatar ? (
                    <AvatarImage src={c.authorAvatar} alt="" />
                  ) : null}
                  <AvatarFallback className="text-[10px]">
                    {label.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm">{c.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
