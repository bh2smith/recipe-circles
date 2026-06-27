import "server-only";
import { createPublicClient, http } from "viem";
import { gnosis } from "viem/chains";
import { GNOSIS_RPC_URL } from "./config";

/** Server-side Gnosis Chain client (SIWE ERC-1271 verify + payment checks). */
export const gnosisClient = createPublicClient({
  chain: gnosis,
  transport: http(GNOSIS_RPC_URL),
});
