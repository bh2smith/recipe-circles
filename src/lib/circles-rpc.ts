import { CIRCLES_RPC_URL } from "./config";

let rpcId = 0;

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(CIRCLES_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
  });
  if (!res.ok) throw new Error(`Circles RPC ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? "Circles RPC error");
  return json.result as T;
}

export interface CirclesProfile {
  name?: string;
  previewImageUrl?: string;
  avatarType?: string;
}

export function getProfile(address: string): Promise<CirclesProfile | null> {
  return rpc<CirclesProfile | null>("circles_getProfileByAddress", [
    address.toLowerCase(),
  ]);
}

export interface TokenBalanceRow {
  tokenAddress: string;
  tokenOwner: string;
  tokenType: string;
  isErc20: boolean;
  isInflationary: boolean;
  attoCircles: string;
  staticAttoCircles: string;
  circles: number;
  staticCircles: number;
}

/** All wrapped ERC-20 Circles balances for an avatar. */
export async function getErc20Balances(
  avatar: string,
): Promise<TokenBalanceRow[]> {
  const rows = await rpc<TokenBalanceRow[]>("circles_getTokenBalances", [
    avatar.toLowerCase(),
  ]);
  return Array.isArray(rows) ? rows.filter((r) => r.isErc20) : [];
}

/** Wrapped balance (atto) of a specific token for an avatar, 0 if none. */
export async function getTokenBalanceAtto(
  avatar: string,
  tokenAddress: string,
): Promise<bigint> {
  const rows = await getErc20Balances(avatar);
  const t = tokenAddress.toLowerCase();
  const row = rows.find((r) => r.tokenAddress.toLowerCase() === t);
  if (!row) return 0n;
  return BigInt(row.isInflationary ? row.staticAttoCircles : row.attoCircles);
}
