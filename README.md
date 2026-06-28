# Circles Recipes

A standalone [Circles](https://aboutcircles.com) mini-app: a community cookbook where users sign in
with their Circles account, post recipes, comment, and **charge gCRC to unlock** their best dishes.

Built for the [circles/garage](https://garage.aboutcircles.com) builder program.

## How it works

- **Auth** — no passwords. Users sign in through the hosted Circles connector iframe
  (`/crc-signin`), which owns the passkey + Safe. Our page talks to it over `postMessage`. A
  Sign-In-With-Ethereum challenge is signed with the Safe (ERC-1271) and verified **on-chain** to
  establish a session cookie.
- **Recipes & comments** — stored in Postgres. Recipes belong to their author; anyone signed in can
  comment.
- **Paywall** — a recipe can have a price in **gCRC** (the Gnosis group token, a wrapped ERC-20).
  To unlock, the reader's connector sends `transfer(author, price)`; the server then **verifies the
  payment on Gnosis Chain** (matching `Transfer(from=payer, to=author, value≥price)`) before
  revealing the body. The body is never sent to an unauthorized client.

## Stack

Next.js 16 (App Router) · Postgres + Drizzle ORM · viem · shadcn/ui + Tailwind v4 · deploy on Vercel.

## Local development

```bash
bun install

# 1. Postgres (any instance works). Example with Docker:
docker run -d --name circles-pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=circles_recipe -p 5433:5432 postgres:17-alpine

# 2. Configure env
cp .env.example .env.local   # then edit values (see below)

# 3. Migrate + run
bun run db:migrate
bun run dev                  # http://localhost:3000
```

### Environment variables

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (Neon in production). |
| `SESSION_SECRET` | 32+ byte secret signing the session JWT. |
| `NEXT_PUBLIC_CONNECTOR_HOST` | Circles connector host (default `https://circles.gnosis.io`). |
| `NEXT_PUBLIC_CIRCLES_RPC_URL` | Circles indexer RPC (profiles, balances). |
| `GNOSIS_RPC_URL` | Gnosis Chain RPC used server-side to verify payments. |
| `NEXT_PUBLIC_GCRC_ERC20_ADDRESS` | **Required for paid recipes** — wrapped ERC-20 contract of the gCRC group token. Free recipes work without it. |

> ⚠️ **gCRC address is not yet pinned.** Set `NEXT_PUBLIC_GCRC_ERC20_ADDRESS` to the canonical
> Gnosis group's wrapped ERC-20 before enabling paid recipes. Until then, the unlock flow is
> disabled gracefully (free recipes are fully functional).

## Deploy (Vercel)

```bash
vercel link
# Provision a database (Vercel Marketplace → Neon Postgres) — sets DATABASE_URL
vercel env add SESSION_SECRET           # + the NEXT_PUBLIC_* and GNOSIS_RPC_URL vars
vercel env pull .env.local
bun run db:migrate                      # against the Neon DATABASE_URL
vercel deploy --prod
```

The app needs only HTTPS and a public URL — the passkey ceremony runs inside the `gnosis.io`
connector iframe, so it works on any `*.vercel.app` domain.

## Submitting to circles/garage

1. Builder profile: <https://garage.aboutcircles.com/signup>
2. Register the app (name, pitch, live URL, repo): <https://garage.aboutcircles.com/register>

Register before the weekly Sunday deadline. You can iterate and resubmit each week.
