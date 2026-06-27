"use client";

import { type RefObject, useEffect, useState } from "react";
import { ChevronDown, LogOut, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { shortAddress } from "@/lib/circles";
import type { CirclesProfile } from "@/lib/circles-rpc";
import { cn } from "@/lib/utils";

interface Props {
  frameRef: RefObject<HTMLIFrameElement | null>;
  src: string;
  address: string | null;
  signedIn: boolean;
  profile: CirclesProfile | null;
  onSignIn: () => Promise<unknown>;
  onDisconnect: () => Promise<void> | void;
}

export function ConnectorDock({
  frameRef,
  src,
  address,
  signedIn,
  profile,
  onSignIn,
  onDisconnect,
}: Props) {
  // Expanded when the user still needs to act (connect / finish sign-in).
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(!(address && signedIn));
  }, [address, signedIn]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border bg-card shadow-xl transition-all",
          open
            ? "h-[520px] max-h-[72vh] w-[360px] max-w-[calc(100vw-2rem)] opacity-100"
            : "pointer-events-none h-0 w-0 border-0 opacity-0",
        )}
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="font-heading text-sm font-semibold">
            Sign in with Circles
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setOpen(false)}
            aria-label="Collapse"
          >
            <ChevronDown className="size-4" />
          </Button>
        </div>
        {/* The iframe stays mounted at all times to preserve the session. */}
        <iframe
          ref={frameRef}
          title="Circles login"
          src={src}
          allow="publickey-credentials-get *; publickey-credentials-create *; clipboard-write"
          className="h-[calc(100%-41px)] w-full"
        />
      </div>

      {address && !open ? (
        <div className="flex items-center gap-2 rounded-full border bg-card py-1.5 pl-1.5 pr-3 shadow-lg">
          <Avatar className="size-7">
            {profile?.previewImageUrl ? (
              <AvatarImage src={profile.previewImageUrl} alt="" />
            ) : null}
            <AvatarFallback className="text-xs">
              {(profile?.name ?? address).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-tight">
            <span className="max-w-[140px] truncate text-xs font-medium">
              {profile?.name ?? shortAddress(address)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {signedIn ? "Signed in" : "Connected"}
            </span>
          </div>
          {!signedIn ? (
            <Button size="sm" className="h-7 px-2 text-xs" onClick={() => onSignIn()}>
              Finish
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onDisconnect()}
            aria-label="Disconnect"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      ) : null}

      {!open ? (
        <Button
          variant="outline"
          size="sm"
          className="rounded-full shadow-lg"
          onClick={() => setOpen(true)}
        >
          <Wallet className="mr-1.5 size-4" />
          {address ? "Account" : "Sign in"}
        </Button>
      ) : null}
    </div>
  );
}
