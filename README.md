# Anihost

A modern anime streaming app with a Next.js frontend and a Hono API backend.

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Hono (Node adapter) API
- Bun runtime/package manager
- SQLite (default), Turso/libSQL, or Supabase/Postgres

## Monorepo Layout

- `src/` - Next.js app, components, client/server actions
- `server/` - Hono API, DB, streaming modules, auth, admin endpoints
- `public/` - static assets
- `refs/` - local references/supporting files

## Core Features

- Anime browsing/search, watch pages, streaming source extraction
- Authentication with JWT + DB-backed sessions
- MAL-style profile pages
  - watch history
  - currently watching
  - stats (hours watched, completion rate, genres)
  - pinned top favorites
  - recent activity and friends sections
- Admin panel
  - user management (sort/search/delete/delete-all)
  - per-user settings screen
  - media source management (add/remove)
  - server health panel (uptime/memory/storage/active streams/users)

## Requirements

- Bun (required)
- Node-compatible environment for Next.js/Hono runtime

## Install

From repository root:

```bash
bun install
cd server && bun install
```

## Run In Development

From repository root:

```bash
bun run dev
```

This starts:

- Frontend: `http://localhost:3000`
- API: `http://localhost:4001`

## Build And Start

From repository root:

```bash
bun run build
bun run start
```

## Deployment

This repo is configured for split deployment:

- Frontend (Next.js): Vercel
- Backend API (Hono): Render

### How It Actually Runs In Production

- Vercel deploys only the Next.js app from repo root using `vercel.json` and `bun run build:web`.
- Render deploys only `server/` using `render.yaml` + `server/Dockerfile`.
- API container listens on `PORT=10000` and Render health-checks `/ping`.
- CORS is controlled by `ORIGIN`, so it must include your Vercel domain.
- Frontend calls backend through `NEXT_PUBLIC_API_URL`.
- Example env templates are included:
  - `.env.example` (frontend)
  - `server/.env.example` (backend)

### One-Click Deployment

1. Use these deployment buttons:

### Render:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/VectorJet/Anihost&branch=main)

### Vercel:

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/VectorJet/Anihost&project-name=anihost&env=NEXT_PUBLIC_API_URL&envDescription=Public+API+base+URL+from+Render+(include+/api/v1))

3. Final wiring:
   - In Vercel, set `NEXT_PUBLIC_API_URL=https://<your-render-domain>/api/v1`
   - In Render, set `ORIGIN=https://<your-vercel-domain>`

### Manual Deployment

`render.yaml` is included at the repo root and points to `server/Dockerfile`.

1. In Render, create a **Blueprint** service from this repository.
2. Render will provision `anihost-api` using the config in `render.yaml`.
3. Set required secret env vars in Render:
   - `SUPABASE_DATABASE_URL`
   - `JWT_SECRET`
   - `ORIGIN` (your Vercel frontend URL, optionally comma-separated with localhost origins)
4. Deploy and note the Render API URL (example: `https://anihost-api.onrender.com`).

API health check path: `/ping`

### Deploy Frontend To Vercel

`vercel.json` is included and uses Bun + `build:web`.

1. Import this repository in Vercel.
2. Set project environment variable:
   - `NEXT_PUBLIC_API_URL=https://<your-render-domain>/api/v1`
3. Deploy.

### Final Wiring

After Vercel gives you the production domain:

1. Update Render `ORIGIN` to include your Vercel domain.
2. Redeploy Render once after updating `ORIGIN`.

## Lint

From repository root:

```bash
bun run lint
```

Backend-only lint/test:

```bash
cd server
bun run lint
bun test
```

## Environment Variables

### Frontend (`.env` in root)

```bash
NEXT_PUBLIC_API_URL=http://localhost:4001/api/v1
```

### Backend (`server/.env` or exported env vars)

```bash
# Server
PORT=4001
ORIGIN=http://localhost:3000

# Auth
JWT_SECRET=change-me
AUTH_ACCESS_TOKEN_TTL_SECONDS=604800
AUTH_SESSION_TTL_SECONDS=604800
AUTH_MAX_SESSIONS_PER_USER=5
AUTH_MAX_SESSION_STORE_SIZE=10000

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_LIMIT=20

# DB provider (sqlite default)
DB_PROVIDER=sqlite
SQLITE_DB_PATH=server/sqlite.db

# Turso/libSQL (optional)
# DB_PROVIDER=turso
# TURSO_DATABASE_URL=libsql://<db>.turso.io
# TURSO_AUTH_TOKEN=<token>

# Supabase/Postgres (optional)
# DB_PROVIDER=supabase
# SUPABASE_DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
# DB_POOL_MAX=10
# POSTGRES_SSL_MODE=require

# Optional Redis cache
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=

# Optional proxy host allowlist
# PROXY_ALLOWED_HOSTS=example.com,cdn.example.com
```

## Database Notes

- SQLite is the default provider.
- API bootstrap creates required tables/indexes if missing.
- `DB_PROVIDER=turso` is supported.
- `DB_PROVIDER=supabase` is supported via direct Postgres connection string.

## API Docs

Run the app and open the API docs route exposed by Hono (configured in `server/lib/configure-docs.js`).

## Scripts (root)

- `bun run dev` - run frontend + API in parallel
- `bun run build` - Next.js build + server TypeScript check
- `bun run start` - start frontend + API in production mode
- `bun run lint` - run ESLint

## Scripts (`server/`)

- `bun run dev` - Hono API in watch mode
- `bun run start` - Hono API production mode
- `bun run lint` - lint backend
- `bun test` - run backend tests

## Notes

- Use Bun instead of npm/yarn/pnpm for dependency and script workflows.
- If streaming providers change upstream behavior, update source extractors under `server/modules/stream/`.
