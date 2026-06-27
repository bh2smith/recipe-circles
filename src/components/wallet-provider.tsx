"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { getAddress } from "viem";
import {
  CirclesConnector,
  type SignatureType,
  type SignResult,
} from "@/lib/connector";
import type { ConnectorTx } from "@/lib/circles";
import { CONNECTOR_SRC } from "@/lib/config";
import { buildSiweMessage } from "@/lib/siwe";
import { getProfile, type CirclesProfile } from "@/lib/circles-rpc";
import { ConnectorDock } from "@/components/connector-dock";

interface WalletState {
  /** Wallet address from the connector (client-side connection). */
  address: string | null;
  /** Address backed by a verified server session (needed for writes). */
  session: string | null;
  signedIn: boolean;
  ready: boolean;
  profile: CirclesProfile | null;
  signMessage: (m: string, t?: SignatureType) => Promise<SignResult>;
  sendTransactions: (txs: ConnectorTx[]) => Promise<string[]>;
  ensureSession: () => Promise<string | null>;
  disconnect: () => Promise<void>;
}

const WalletCtx = createContext<WalletState | null>(null);

export function useWallet(): WalletState {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWallet must be used within <WalletProvider>");
  return ctx;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const connectorRef = useRef<CirclesConnector | null>(null);
  if (!connectorRef.current) connectorRef.current = new CirclesConnector();
  const connector = connectorRef.current;

  const [address, setAddress] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<string | null>(null);
  const [profile, setProfile] = useState<CirclesProfile | null>(null);
  const signingIn = useRef(false);

  const ensureSession = useCallback(async (): Promise<string | null> => {
    const addr = connector.address;
    if (!addr || signingIn.current) return null;
    signingIn.current = true;
    try {
      // Already authenticated for this address?
      const me = await fetch("/api/auth/me")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      if (me?.address?.toLowerCase() === addr) {
        setSession(addr);
        return addr;
      }
      // SIWE challenge → sign (ERC-1271) → verify.
      const { nonce } = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      }).then((r) => r.json());

      const message = buildSiweMessage({
        domain: window.location.host,
        address: getAddress(addr),
        uri: window.location.origin,
        nonce,
        issuedAt: new Date().toISOString(),
      });

      const { signature } = await connector.signMessage(message, "erc1271");

      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr, message, signature }),
      });
      if (!res.ok) throw new Error("Sign-in verification failed");
      const data = await res.json();
      setSession(data.address);
      router.refresh();
      return data.address;
    } finally {
      signingIn.current = false;
    }
  }, [connector, router]);

  // Wire the connector to the iframe and react to state changes.
  useEffect(() => {
    if (!frameRef.current) return;
    connector.attach(frameRef.current);
    const off = connector.subscribe(() => {
      setReady(connector.ready);
      setAddress(connector.address);
    });
    return () => {
      off();
      connector.detach();
    };
  }, [connector]);

  // On connect: load profile + establish a server session.
  useEffect(() => {
    if (!address) {
      setProfile(null);
      setSession(null);
      return;
    }
    getProfile(address).then(setProfile).catch(() => setProfile(null));
    ensureSession().catch(() => {
      /* user may cancel; they can retry from the dock */
    });
  }, [address, ensureSession]);

  const disconnect = useCallback(async () => {
    connector.disconnect();
    setSession(null);
    setProfile(null);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.refresh();
  }, [connector, router]);

  const value: WalletState = {
    address,
    session,
    signedIn: !!session,
    ready,
    profile,
    signMessage: connector.signMessage.bind(connector),
    sendTransactions: connector.sendTransactions.bind(connector),
    ensureSession,
    disconnect,
  };

  return (
    <WalletCtx.Provider value={value}>
      {children}
      <ConnectorDock
        frameRef={frameRef}
        src={CONNECTOR_SRC}
        address={address}
        signedIn={!!session}
        profile={profile}
        onSignIn={ensureSession}
        onDisconnect={disconnect}
      />
    </WalletCtx.Provider>
  );
}
