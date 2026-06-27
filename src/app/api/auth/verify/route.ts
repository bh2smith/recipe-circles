import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type { Hex } from "viem";
import { db } from "@/db";
import { nonces, users } from "@/db/schema";
import { parseSiweMessage } from "@/lib/siwe";
import { gnosisClient } from "@/lib/chain";
import { setSessionCookie } from "@/lib/session";
import { getProfile } from "@/lib/circles-rpc";

export async function POST(req: Request) {
  const { address, message, signature } = await req.json().catch(() => ({}));
  if (!address || !message || !signature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const addr = String(address).toLowerCase();

  const parsed = parseSiweMessage(message);
  if (!parsed.nonce || parsed.address?.toLowerCase() !== addr) {
    return NextResponse.json({ error: "Malformed message" }, { status: 400 });
  }

  const [row] = await db
    .select()
    .from(nonces)
    .where(eq(nonces.nonce, parsed.nonce));
  if (!row || row.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "Invalid or expired nonce" },
      { status: 401 },
    );
  }

  // Verify the ERC-1271 (Safe smart-account) signature on Gnosis Chain.
  const valid = await gnosisClient
    .verifyMessage({
      address: addr as Hex,
      message,
      signature: signature as Hex,
    })
    .catch(() => false);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Single-use nonce.
  await db.delete(nonces).where(eq(nonces.nonce, parsed.nonce));

  // Upsert the user, caching their Circles profile when available.
  const profile = await getProfile(addr).catch(() => null);
  if (profile?.name || profile?.previewImageUrl) {
    await db
      .insert(users)
      .values({
        address: addr,
        name: profile.name ?? null,
        avatarUrl: profile.previewImageUrl ?? null,
      })
      .onConflictDoUpdate({
        target: users.address,
        set: {
          name: profile.name ?? null,
          avatarUrl: profile.previewImageUrl ?? null,
        },
      });
  } else {
    await db.insert(users).values({ address: addr }).onConflictDoNothing();
  }

  await setSessionCookie(addr);
  return NextResponse.json({ address: addr });
}
