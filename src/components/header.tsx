"use client";

import Link from "next/link";
import { ChefHat, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/config";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ChefHat className="size-5" />
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight">
            {APP_NAME}
          </span>
        </Link>
        <Link
          href="/create"
          className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
        >
          <Plus className="mr-1 size-4" />
          New recipe
        </Link>
      </div>
    </header>
  );
}
