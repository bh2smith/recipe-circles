import "server-only";
import { and, arrayContains, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { comments, recipes, unlocks, users } from "@/db/schema";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UUID_RE.test(s);

export interface RecipeDTO {
  id: string;
  authorAddress: string;
  authorName: string | null;
  authorAvatar: string | null;
  title: string;
  teaser: string | null;
  body: string | null; // null when locked for this viewer
  keywords: string[];
  priceAtto: string;
  free: boolean;
  locked: boolean;
  isAuthor: boolean;
  unlocked: boolean;
  commentCount: number;
  createdAt: string;
}

export interface CommentDTO {
  id: string;
  recipeId: string;
  authorAddress: string;
  authorName: string | null;
  authorAvatar: string | null;
  body: string;
  createdAt: string;
}

type RecipeRow = typeof recipes.$inferSelect & {
  authorName: string | null;
  authorAvatar: string | null;
};

function authorize(row: RecipeRow, viewer: string | null, unlocked: boolean) {
  const free = BigInt(row.priceAtto) === 0n;
  const isAuthor = !!viewer && viewer === row.authorAddress;
  const authorized = free || isAuthor || unlocked;
  return { free, isAuthor, authorized };
}

function toDTO(
  row: RecipeRow,
  viewer: string | null,
  unlocked: boolean,
  commentCount: number,
): RecipeDTO {
  const { free, isAuthor, authorized } = authorize(row, viewer, unlocked);
  return {
    id: row.id,
    authorAddress: row.authorAddress,
    authorName: row.authorName,
    authorAvatar: row.authorAvatar,
    title: row.title,
    teaser: row.teaser,
    body: authorized ? row.body : null,
    keywords: row.keywords,
    priceAtto: row.priceAtto,
    free,
    locked: !authorized,
    isAuthor,
    unlocked,
    commentCount,
    createdAt: row.createdAt.toISOString(),
  };
}

const recipeSelect = {
  id: recipes.id,
  authorAddress: recipes.authorAddress,
  title: recipes.title,
  body: recipes.body,
  teaser: recipes.teaser,
  keywords: recipes.keywords,
  priceAtto: recipes.priceAtto,
  createdAt: recipes.createdAt,
  updatedAt: recipes.updatedAt,
  authorName: users.name,
  authorAvatar: users.avatarUrl,
};

async function unlockedSet(
  recipeIds: string[],
  viewer: string | null,
): Promise<Set<string>> {
  if (!viewer || recipeIds.length === 0) return new Set();
  const rows = await db
    .select({ recipeId: unlocks.recipeId })
    .from(unlocks)
    .where(
      and(
        eq(unlocks.userAddress, viewer),
        inArray(unlocks.recipeId, recipeIds),
      ),
    );
  return new Set(rows.map((r) => r.recipeId));
}

async function commentCounts(
  recipeIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (recipeIds.length === 0) return map;
  const rows = await db
    .select({
      recipeId: comments.recipeId,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(comments)
    .where(inArray(comments.recipeId, recipeIds))
    .groupBy(comments.recipeId);
  for (const r of rows) map.set(r.recipeId, r.count);
  return map;
}

export async function listRecipes(
  viewer: string | null,
  opts: { keyword?: string } = {},
): Promise<RecipeDTO[]> {
  const keyword = opts.keyword?.trim().toLowerCase();
  const rows = (await db
    .select(recipeSelect)
    .from(recipes)
    .leftJoin(users, eq(recipes.authorAddress, users.address))
    .where(keyword ? arrayContains(recipes.keywords, [keyword]) : undefined)
    .orderBy(desc(recipes.createdAt))
    .limit(100)) as RecipeRow[];

  const ids = rows.map((r) => r.id);
  const [unlocked, counts] = await Promise.all([
    unlockedSet(ids, viewer),
    commentCounts(ids),
  ]);

  return rows.map((row) =>
    toDTO(row, viewer, unlocked.has(row.id), counts.get(row.id) ?? 0),
  );
}

export async function getRecipe(
  id: string,
  viewer: string | null,
): Promise<RecipeDTO | null> {
  if (!isUuid(id)) return null;
  const [row] = (await db
    .select(recipeSelect)
    .from(recipes)
    .leftJoin(users, eq(recipes.authorAddress, users.address))
    .where(eq(recipes.id, id))
    .limit(1)) as RecipeRow[];
  if (!row) return null;

  const [unlocked, counts] = await Promise.all([
    unlockedSet([id], viewer),
    commentCounts([id]),
  ]);
  return toDTO(row, viewer, unlocked.has(id), counts.get(id) ?? 0);
}

/** Raw recipe row (server-internal; includes author + price for verification). */
export async function getRecipeRaw(id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
  return row ?? null;
}

export async function isUnlocked(
  recipeId: string,
  viewer: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: unlocks.id })
    .from(unlocks)
    .where(
      and(eq(unlocks.recipeId, recipeId), eq(unlocks.userAddress, viewer)),
    )
    .limit(1);
  return !!row;
}

/** Records an unlock. Returns false if it conflicted (tx hash or pair reused). */
export async function recordUnlock(
  recipeId: string,
  userAddress: string,
  txHash: string,
): Promise<boolean> {
  const rows = await db
    .insert(unlocks)
    .values({ recipeId, userAddress, txHash })
    .onConflictDoNothing()
    .returning({ id: unlocks.id });
  return rows.length > 0;
}

export async function deleteRecipe(id: string): Promise<void> {
  await db.delete(recipes).where(eq(recipes.id, id));
}

export async function updateRecipe(
  id: string,
  input: {
    title: string;
    body: string;
    teaser: string | null;
    keywords: string[];
    priceAtto: string;
  },
): Promise<void> {
  await db
    .update(recipes)
    .set({
      title: input.title,
      body: input.body,
      teaser: input.teaser,
      keywords: input.keywords,
      priceAtto: input.priceAtto,
      updatedAt: new Date(),
    })
    .where(eq(recipes.id, id));
}

export async function createRecipe(input: {
  authorAddress: string;
  title: string;
  body: string;
  teaser: string | null;
  keywords: string[];
  priceAtto: string;
}): Promise<string> {
  await db
    .insert(users)
    .values({ address: input.authorAddress })
    .onConflictDoNothing();
  const [row] = await db
    .insert(recipes)
    .values({
      authorAddress: input.authorAddress,
      title: input.title,
      body: input.body,
      teaser: input.teaser,
      keywords: input.keywords,
      priceAtto: input.priceAtto,
    })
    .returning({ id: recipes.id });
  return row.id;
}

/** Distinct keywords across all recipes, most-used first (for the browse bar). */
export async function listAllKeywords(
  limit = 40,
): Promise<{ keyword: string; count: number }[]> {
  const result = await db.execute<{ keyword: string; count: number }>(sql`
    select kw as keyword, cast(count(*) as int) as count
    from ${recipes}, unnest(${recipes.keywords}) as kw
    group by kw
    order by count(*) desc, kw asc
    limit ${limit}
  `);
  return result.rows;
}

export async function listComments(recipeId: string): Promise<CommentDTO[]> {
  if (!isUuid(recipeId)) return [];
  const rows = await db
    .select({
      id: comments.id,
      recipeId: comments.recipeId,
      authorAddress: comments.authorAddress,
      body: comments.body,
      createdAt: comments.createdAt,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorAddress, users.address))
    .where(eq(comments.recipeId, recipeId))
    .orderBy(comments.createdAt);

  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function addComment(
  recipeId: string,
  authorAddress: string,
  body: string,
): Promise<CommentDTO> {
  await db.insert(users).values({ address: authorAddress }).onConflictDoNothing();
  const [row] = await db
    .insert(comments)
    .values({ recipeId, authorAddress, body })
    .returning();
  return { ...row, createdAt: row.createdAt.toISOString(), authorName: null, authorAvatar: null };
}
