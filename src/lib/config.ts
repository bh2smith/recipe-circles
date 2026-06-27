// Centralised configuration. NEXT_PUBLIC_* values are inlined into the client
// bundle; everything else is server-only.

export const APP_NAME = "Circles Recipes";

/** Hosted Circles connector that serves the /crc-signin login iframe. */
export const CONNECTOR_HOST =
  process.env.NEXT_PUBLIC_CONNECTOR_HOST?.replace(/\/$/, "") ??
  "https://circles.gnosis.io";

/** The full src for the connector iframe. */
export const CONNECTOR_SRC = `${CONNECTOR_HOST}/crc-signin`;

/** Circles indexer RPC (profiles, balances, group lookup). */
export const CIRCLES_RPC_URL =
  process.env.NEXT_PUBLIC_CIRCLES_RPC_URL ?? "https://rpc.aboutcircles.com/";

/** Gnosis Chain JSON-RPC used server-side to verify payment transactions. */
export const GNOSIS_RPC_URL =
  process.env.GNOSIS_RPC_URL ??
  process.env.NEXT_PUBLIC_GNOSIS_RPC_URL ??
  "https://rpc.gnosischain.com";

/**
 * Wrapped ERC-20 contract of the gCRC group token used for unlock payments.
 * Lowercased. Empty until configured — paid recipes are disabled when unset.
 */
export const GCRC_ERC20_ADDRESS = (
  process.env.NEXT_PUBLIC_GCRC_ERC20_ADDRESS ?? ""
).toLowerCase();

export const GCRC_CONFIGURED = /^0x[0-9a-f]{40}$/.test(GCRC_ERC20_ADDRESS);

/** gCRC and all Circles tokens use 18 decimals (atto units). */
export const CRC_DECIMALS = 18;

export const GNOSISSCAN_TX = (hash: string) => `https://gnosisscan.io/tx/${hash}`;
