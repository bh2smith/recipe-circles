ALTER TABLE "recipes" ADD COLUMN "keywords" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
CREATE INDEX "recipes_keywords_idx" ON "recipes" USING gin ("keywords");