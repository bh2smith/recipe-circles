import { APP_NAME } from "./config";

export interface SiweFields {
  domain: string;
  address: string;
  uri: string;
  nonce: string;
  issuedAt: string;
}

/** Build a human-readable SIWE-style challenge message. */
export function buildSiweMessage(f: SiweFields): string {
  return [
    `${f.domain} wants you to sign in with your Circles account:`,
    f.address,
    "",
    `Sign in to ${APP_NAME}.`,
    "",
    `URI: ${f.uri}`,
    "Version: 1",
    `Nonce: ${f.nonce}`,
    `Issued At: ${f.issuedAt}`,
  ].join("\n");
}

/** Extract the nonce + address lines from a SIWE message for verification. */
export function parseSiweMessage(message: string): {
  address?: string;
  nonce?: string;
} {
  const address = message.match(/^0x[0-9a-fA-F]{40}$/m)?.[0];
  const nonce = message.match(/^Nonce: (\S+)$/m)?.[1];
  return { address, nonce };
}
