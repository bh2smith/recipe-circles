import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { lt } from "drizzle-orm";
import { db } from "@/db";
import { nonces } from "@/db/schema";

export async function POST(req: Request) {
  const { address } = await req.json().catch(() => ({}));
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Opportunistically prune expired nonces.
  await db.delete(nonces).where(lt(nonces.expiresAt, new Date())).catch(() => {});

  await db.insert(nonces).values({
    nonce,
    address: typeof address === "string" ? address.toLowerCase() : null,
    expiresAt,
  });

  return NextResponse.json({ nonce });
}
