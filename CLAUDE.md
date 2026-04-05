# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Full-stack TypeScript monorepo: Astro (SSG frontend) + Hono (API on Azure Functions), deployed to Azure Static Web Apps. End-to-end type safety via Hono RPC.

## Commands

```bash
# Development (runs API watcher + SWA dev server)
npm run dev

# Build all workspaces
npm run build

# Database (Drizzle ORM, run from root with -w flag)
npm run db:push -w api      # Push schema to DB
npm run db:generate -w api  # Generate migrations
npm run db:migrate -w api   # Run migrations
npm run db:studio -w api    # Open Drizzle Studio
npm run db:seed -w api      # Seed sample data
```

## Architecture

**Monorepo layout** (`packages/api`, `packages/ui`) managed by npm workspaces. UI depends on API as a dev dependency for RPC type imports.

### API (`packages/api`)

- **Entry point:** `src/index.ts` registers a single Azure Functions HTTP trigger that delegates to Hono via a custom adapter (`src/lib/hono-azurefunc-adapter.ts`).
- **Router:** `src/app.ts` defines the Hono app. Route modules live in `src/routes/`. The app type is exported for RPC consumption by the UI.
- **Auth middleware** (`src/routes/management/middleware.ts`): Parses Azure SWA's `x-ms-client-principal` base64 header. Protected routes return 401 if missing.
- **DB middleware** (`src/db/middleware.ts`): Injects a Drizzle ORM instance into Hono context via `c.set('db', ...)`.
- **DB client** (`src/db/client.ts`): Factory that returns PGlite (in-memory, for dev) or postgres-js based on `DATABASE_URL` env var. Value `"pglite"` triggers the dev path.
- **Schema** (`src/db/schema.ts`): Drizzle schema definitions.

### UI (`packages/ui`)

- Astro pages in `src/pages/`. No SSR adapter — static output only.
- **RPC client** (`src/lib/api-client.ts`): Uses `hono/client` with the API's exported `AppType` for type-safe fetch calls.

### Key conventions

- API tsconfig targets CommonJS (required by Azure Functions Node.js worker).
- UI tsconfig extends `astro/tsconfigs/strict`.
- API tsconfig sets `skipLibCheck: true` (needed for Drizzle's multi-dialect types).
- SWA CLI config (`swa-cli.config.json`) ties the pieces together: app=`packages/ui`, api=`packages/api`, output=`dist`.
- Documentation lives in git commit messages by project convention — see `README.md`.
