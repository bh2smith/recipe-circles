# circles/garage submission — Circles Recipes

Ready-to-paste content for https://garage.aboutcircles.com/register
(after creating your builder profile at https://garage.aboutcircles.com/signup).

| Field | Value |
| --- | --- |
| **Name** | Circles Recipes |
| **Live URL** | https://recipe-circles.vercel.app |
| **Repo** | https://github.com/bh2smith/recipe-circles |
| **Readme** | https://github.com/bh2smith/recipe-circles#readme |
| **Payments address** | _your Circles Safe address_ (set during /signup) |

---

## Tagline

A community cookbook where chefs get paid in gCRC to unlock their best recipes.

## Pitch (~100 words)

Circles Recipes is a community cookbook built natively on Circles. You sign in with
your Circles account — no passwords, just the passkey-backed Safe through the Circles
connector — then post recipes and talk in the comments. The twist: a chef can lock a
recipe behind a gCRC price. A reader pays in the Gnosis group token and the recipe
unlocks — and the payment is verified **on-chain** (the gCRC transfer from reader to
author) before any content is revealed, so the paywall is real, not honor-system. It's
a creator-economy idea a non-crypto person immediately gets: share what you cook, earn
a little for your best dishes.

## Why it fits the judging criteria

**Circles integration (native, not bolted-on).** Circles is the spine of the app:
- **Identity** = your Circles account. Login is the hosted `/crc-signin` connector
  (passkey + Safe); a Sign-In-With-Ethereum challenge is signed by the Safe and
  verified on-chain via ERC-1271 before a session is issued. No email/password exists.
- **Money** = gCRC. The pay-to-unlock paywall settles in the active Gnosis group token
  (static `s-gCRC` wrapped ERC-20). The server confirms the on-chain `Transfer`
  (`from=reader, to=author, value ≥ price`) before serving the recipe — so value, not
  trust, gates the content.
- **Profiles** = Circles profiles (name + avatar) pulled from the Circles RPC.

**Usefulness.** Recipe sharing is mainstream and sticky; the gCRC paywall gives
creators a concrete reason to keep posting and readers a reason to come back.

**UX.** A deliberate "cookbook" design — Fraunces display serif, a warm terracotta
palette, clean cards and a docked Circles sign-in — not a grant template. Free recipes
read instantly; paid ones show a teaser and a one-tap unlock.

## Stack

Next.js 16 (App Router) · Neon Postgres · Drizzle · viem · deployed on Vercel.

## Roadmap

- Ship an embedded-miniapp build so it runs inside the Circles app (captures the weekly
  activity metric).
- Recipe photos, tipping on top of unlocks, and trust-graph discovery (recipes from
  people you already trust on Circles).
