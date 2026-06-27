import { CONNECTOR_HOST } from "./config";
import type { ConnectorTx } from "./circles";

export type SignatureType = "erc1271" | "raw";
export interface SignResult {
  signature: string;
  verified: boolean;
}

interface Pending {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

/**
 * Bridge to the Circles `/crc-signin` connector iframe via postMessage.
 * Ported from web3skeptic/crc-signin-login-demo, hardened with origin/source
 * checks on every inbound message (the demo validates neither).
 */
export class CirclesConnector {
  private frame: HTMLIFrameElement | null = null;
  private pending = new Map<string, Pending>();
  private counter = 0;
  private listeners = new Set<() => void>();
  private readonly origin = new URL(CONNECTOR_HOST).origin;

  address: string | null = null;
  ready = false;

  attach(frame: HTMLIFrameElement) {
    this.frame = frame;
    window.addEventListener("message", this.onMessage);
  }

  detach() {
    window.removeEventListener("message", this.onMessage);
    this.frame = null;
    this.ready = false;
  }

  /** Subscribe to any state change (ready / address). Returns an unsubscribe. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const fn of this.listeners) fn();
  }

  private post(message: Record<string, unknown>) {
    // Pin the target origin — never "*".
    this.frame?.contentWindow?.postMessage(message, this.origin);
  }

  private onMessage = (event: MessageEvent) => {
    if (event.source !== this.frame?.contentWindow) return;
    if (event.origin !== this.origin) return;
    const d = event.data;
    if (!d || typeof d !== "object" || typeof d.type !== "string") return;

    switch (d.type) {
      case "crc_bridge_ready":
        this.ready = true;
        this.post({ type: "request_address" });
        this.notify();
        break;
      case "wallet_connected":
        this.address = String(d.address).toLowerCase();
        this.notify();
        break;
      case "wallet_disconnected":
        this.address = null;
        this.notify();
        break;
      case "tx_success":
        this.settle(d.requestId, true, (d.hashes ?? []) as string[]);
        break;
      case "tx_rejected":
        this.settle(d.requestId, false, d.reason ?? d.error);
        break;
      case "sign_success":
        this.settle(d.requestId, true, {
          signature: d.signature,
          verified: !!d.verified,
        });
        break;
      case "sign_rejected":
        this.settle(d.requestId, false, d.reason ?? d.error);
        break;
    }
  };

  private settle(requestId: string, ok: boolean, payload: unknown) {
    const p = this.pending.get(requestId);
    if (!p) return;
    this.pending.delete(requestId);
    if (ok) p.resolve(payload);
    else
      p.reject(
        new Error(typeof payload === "string" ? payload : "Request rejected"),
      );
  }

  sendTransactions(transactions: ConnectorTx[]): Promise<string[]> {
    if (!this.ready) return Promise.reject(new Error("Connector not ready"));
    const requestId = `tx_${++this.counter}`;
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve: resolve as Pending["resolve"], reject });
      this.post({ type: "send_transactions", requestId, transactions });
    });
  }

  signMessage(
    message: string,
    signatureType: SignatureType = "erc1271",
  ): Promise<SignResult> {
    if (!this.ready) return Promise.reject(new Error("Connector not ready"));
    const requestId = `sign_${++this.counter}`;
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve: resolve as Pending["resolve"], reject });
      this.post({ type: "sign_message", requestId, message, signatureType });
    });
  }

  disconnect() {
    this.address = null;
    this.post({ type: "disconnect" });
    this.notify();
  }
}
