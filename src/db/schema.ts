import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** A Circles user, identified by their lowercased Safe address. */
export const users = pgTable("users", {
  address: text("address").primaryKey(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** A recipe. `priceAtto` is the unlock price in 18-decimal gCRC units (0 = free). */
export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorAddress: text("author_address")
      .notNull()
      .references(() => users.address),
    title: text("title").notNull(),
    body: text("body").notNull(),
    teaser: text("teaser"),
    /** Free-form, lowercased tags for browsing (e.g. {vegan,dessert,30-min}). */
    keywords: text("keywords")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    priceAtto: numeric("price_atto", { precision: 78, scale: 0 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("recipes_author_idx").on(t.authorAddress),
    index("recipes_created_idx").on(t.createdAt),
    index("recipes_keywords_idx").using("gin", t.keywords),
  ],
);

/** A comment in a recipe's message feed. */
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    authorAddress: text("author_address")
      .notNull()
      .references(() => users.address),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("comments_recipe_idx").on(t.recipeId)],
);

/** Records that `userAddress` paid to unlock `recipeId`, with the payment tx. */
export const unlocks = pgTable(
  "unlocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    userAddress: text("user_address").notNull(),
    txHash: text("tx_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("unlocks_tx_idx").on(t.txHash),
    uniqueIndex("unlocks_recipe_user_idx").on(t.recipeId, t.userAddress),
  ],
);

/** Single-use SIWE login challenge. */
export const nonces = pgTable("nonces", {
  nonce: text("nonce").primaryKey(),
  address: text("address"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type Recipe = typeof recipes.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type User = typeof users.$inferSelect;
export type Unlock = typeof unlocks.$inferSelect;
