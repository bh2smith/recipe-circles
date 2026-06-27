import {
  encodeFunctionData,
  getAddress,
  parseUnits,
  formatUnits,
} from "viem";
import { CRC_DECIMALS } from "./config";

export const ERC20_TRANSFER_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

/** A transaction in the shape the Circles connector expects. */
export interface ConnectorTx {
  to: string;
  data: string;
  value: string;
}

/** Build calldata for a plain ERC-20 `transfer(to, amount)` (e.g. gCRC). */
export function buildErc20Transfer(
  token: string,
  to: string,
  amountAtto: bigint,
): ConnectorTx {
  const data = encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [getAddress(to), amountAtto],
  });
  return { to: getAddress(token), data, value: "0" };
}

/** Human CRC amount (e.g. "1.5") → 18-decimal atto units. */
export function crcToAtto(amount: string | number): bigint {
  return parseUnits(String(amount), CRC_DECIMALS);
}

/** atto units → human CRC string. */
export function attoToCrc(atto: bigint | string): string {
  return formatUnits(BigInt(atto), CRC_DECIMALS);
}

/** Pretty, trimmed CRC display (e.g. "1.5 CRC"). */
export function formatCrc(atto: bigint | string, maxFractionDigits = 4): string {
  const n = Number(formatUnits(BigInt(atto), CRC_DECIMALS));
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits });
}

export function shortAddress(addr: string): string {
  return addr && addr.length > 10
    ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
    : addr;
}

export function isZeroPrice(priceAtto: string | bigint): boolean {
  try {
    return BigInt(priceAtto) === 0n;
  } catch {
    return true;
  }
}
