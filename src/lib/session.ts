import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "session";
const ALG = "HS256";

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET is not configured");
  return new TextEncoder().encode(s);
}

export async function createSessionToken(address: string): Promise<string> {
  return new SignJWT({ address: address.toLowerCase() })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.address === "string" ? payload.address : null;
  } catch {
    return null;
  }
}

/** Set the session cookie on the response. */
export async function setSessionCookie(address: string): Promise<void> {
  const token = await createSessionToken(address);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Returns the authenticated (lowercased) address, or null. */
export async function getSessionAddress(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Throws a 401-style error if not authenticated. */
export async function requireSession(): Promise<string> {
  const address = await getSessionAddress();
  if (!address) throw new UnauthorizedError();
  return address;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
