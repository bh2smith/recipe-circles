import { NextResponse } from "next/server";
import { decodeEventLog, parseAbiItem, type Hex } from "viem";
import { getSessionAddress } from "@/lib/session";
import { gnosisClient } from "@/lib/chain";
import { GCRC_CONFIGURED, GCRC_ERC20_ADDRESS } from "@/lib/config";
import { getRecipeRaw, isUnlocked, recordUnlock } from "@/lib/data";

type Ctx = { params: Promise<{ id: string }> };

const TRANSFER = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const viewer = await getSessionAddress();
  if (!viewer) {
    return NextResponse.json({ error: "Sign in to unlock" }, { status: 401 });
  }

  const { txHash } = await req.json().catch(() => ({}));
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash ?? "")) {
    return NextResponse.json({ error: "Invalid transaction hash" }, { status: 400 });
  }

  const recipe = await getRecipeRaw(id);
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const price = BigInt(recipe.priceAtto);
  if (price === 0n) return NextResponse.json({ unlocked: true }); // free
  if (await isUnlocked(id, viewer)) {
    return NextResponse.json({ unlocked: true });
  }
  if (!GCRC_CONFIGURED) {
    return NextResponse.json(
      { error: "Payments are not configured yet" },
      { status: 503 },
    );
  }

  // Wait for the payment tx to be mined, then verify it.
  const receipt = await gnosisClient
    .waitForTransactionReceipt({ hash: txHash as Hex, timeout: 60_000 })
    .catch(() => null);
  if (!receipt || receipt.status !== "success") {
    return NextResponse.json(
      { error: "Payment transaction not found or failed" },
      { status: 400 },
    );
  }

  // Require a gCRC Transfer(from=payer, to=author, value>=price) in this tx.
  const author = recipe.authorAddress.toLowerCase();
  let paid = false;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== GCRC_ERC20_ADDRESS) continue;
    try {
      const ev = decodeEventLog({
        abi: [TRANSFER],
        data: log.data,
        topics: log.topics,
      });
      const from = String(ev.args.from).toLowerCase();
      const to = String(ev.args.to).toLowerCase();
      const value = ev.args.value as bigint;
      if (from === viewer && to === author && value >= price) {
        paid = true;
        break;
      }
    } catch {
      // not a Transfer log; ignore
    }
  }

  if (!paid) {
    return NextResponse.json(
      { error: "No matching gCRC payment found in transaction" },
      { status: 400 },
    );
  }

  const inserted = await recordUnlock(id, viewer, txHash);
  if (!inserted && !(await isUnlocked(id, viewer))) {
    // tx hash already consumed by a different unlock
    return NextResponse.json(
      { error: "This transaction was already used" },
      { status: 409 },
    );
  }

  return NextResponse.json({ unlocked: true });
}
