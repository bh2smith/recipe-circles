import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RecipeForm } from "@/components/recipe-form";

export default function CreatePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All recipes
      </Link>
      <h1 className="mb-2 font-heading text-3xl font-semibold tracking-tight">
        Share a recipe
      </h1>
      <p className="mb-8 text-muted-foreground">
        Post it for everyone, or set a gCRC price to unlock.
      </p>
      <RecipeForm />
    </div>
  );
}
