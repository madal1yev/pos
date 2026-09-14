# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MaxPOS — a Point of Sale & inventory management system for restaurants/retail. Two independent apps in one repo: `backend/` (Express API) and `frontend/` (React + Vite SPA). There is no shared root `node_modules`; the root `package.json` just proxies into each app.

## Commands

Run these from the relevant subdirectory (`backend/` or `frontend/`) unless noted.

```bash
# Backend
cd backend
npm install
npm run dev          # nodemon src/server.js (local dev, SQLite by default)
npm start             # node src/server.js (production mode)
npm run migrate       # run SQLite migrations/run.js (initial schema)
npm run migrate:pg    # run PostgreSQL migrations/pg-migrate.js
npm run seed          # migrations/seed.js — seeds default data/admin user

# Frontend
cd frontend
npm install
npm run dev            # vite dev server on :5173, proxies /api and /uploads to :5000
npm run build           # vite build -> frontend/dist
npm run preview

# From repo root (convenience wrappers around the backend app)
npm run dev     # == cd backend && npm run dev
npm run build   # == cd frontend && npm run build
npm run migrate # == cd backend && npm run migrate
```

There is no configured lint or unit test runner in either `package.json`. The only test artifact is `backend/tests/test_playwright.js`, a standalone script (not wired to `npm test`) that hits a **running** server at `http://localhost:5000` — start the backend first, then run it with `node backend/tests/test_playwright.js`.

Default login after seeding: `admin@pos.uz` / `admin123`.

## Architecture

### Dual-database abstraction (`backend/src/config/db.js`)
The backend runs on **SQLite locally** (`better-sqlite3`, file `backend/pos_database.db`) and **PostgreSQL in production** (`pg`, via `DATABASE_URL`). Which one loads is decided once, at require-time, purely by whether `DATABASE_URL` is set — the rest of the codebase is written against a single unified interface (`db.query(sql, params)` returning `{ rows, rowCount }`, plus `db.isSqlite`) and must stay agnostic to which backend is active. All SQL is written in Postgres placeholder style (`$1, $2, …`); the SQLite branch rewrites `$N` → `?` and emulates `RETURNING` (real for `INSERT`, rewritten to a follow-up `SELECT` for `UPDATE` since better-sqlite3 has no native support). When touching a controller, prefer this parameter style and avoid SQLite- or Postgres-only syntax so both paths keep working.

### Schema evolves via startup auto-migration, not a migration runner
Both branches of `db.js` run an idempotent list of `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (Postgres) / conditional `ALTER TABLE ADD COLUMN` (SQLite, checked against `PRAGMA table_info`) plus `CREATE TABLE IF NOT EXISTS` statements every time the process boots. `backend/migrations/run.js`, `pg-migrate.js`, and `seed.js` only lay down the *initial* schema/data. **When adding a new column or table, add it to the migration list inside `db.js` (both the SQLite and Postgres branches) rather than relying solely on the one-shot migration scripts** — that's what keeps existing local DBs and the Vercel Postgres instance in sync without a manual migrate step.

### Vercel serverless deployment
`backend/api/index.js` is the actual Vercel function entry point; it requires `src/server.js` (which exports the Express `app` without calling `.listen()` when `process.env.VERCEL` is set) and additionally runs a one-time Postgres table-creation block on the first invocation per cold start (`migrated` flag). Frontend and backend deploy as **separate** Vercel projects (each has its own `vercel.json`); the frontend talks to the backend via `VITE_API_URL`, and CORS on the backend is driven by `FRONTEND_URL` (comma-separated) plus hardcoded allowances for LAN IP ranges (192.168.x.x/10.x.x.x/172.16-31.x.x) to support running the POS on a local network for in-store tablets/registers. `render.yaml` describes an alternate deployment target (Render) for the backend only.

### Auth & authorization
JWT-based (`backend/src/middleware/auth.js`), token sent as `Authorization: Bearer` or a cookie, checked against a `token_blacklist` table so logout can actually invalidate a token before expiry. Roles form a hierarchy (`admin(100) > manager(80) > stock(60) > cashier(40) > view(20)`) — `authorize(...roles)` allows exact role matches *or* any role whose level exceeds the minimum required level, so prefer reusing the exported helpers (`canManageUsers`, `canManageProducts`, `canManageSettings`, `canViewReports`, `canProcessSales`, `canViewSales`) in new routes rather than hand-rolling role checks.

### Backend module layout
Routes (`src/routes/*.js`) are thin and mount under `/api/<resource>` in `src/server.js`; business logic lives in matching `src/controllers/*.js`; request validation uses `zod` schemas centralized in `src/validators/schemas.js` with a shared `validate` middleware. `src/utils/helpers.js` holds cross-cutting helpers (e.g. invoice number generation).

### Frontend state & data flow
Global state uses **zustand** stores under `src/context/` (`AuthContext.jsx`, `CartContext.jsx`, `SettingsContext.jsx`) — despite the folder name these are zustand `create()` stores, not React Context. Auth persists `pos_token`/`pos_user` to `localStorage`. All HTTP calls go through the single axios instance in `src/services/api.js`, which attaches the bearer token, strips `Content-Type` for `FormData` uploads, and force-redirects to `/login` on a `401` (clearing stored auth first). Add new endpoints as named exports (e.g. `productsAPI`) in that same file rather than calling axios directly from components. Routing (`src/App.jsx`) wraps all authenticated pages in a single `ProtectedRoute` + `Layout` route; the PWA is configured in `vite.config.js` (`vite-plugin-pwa`) with `NetworkOnly` for `/api/*` so API calls are never served from the service worker cache.

### `claude/` directory conventions
This repo keeps its own Claude Code workspace under `claude/` (see `claude/RULES.md`, in Uzbek). When creating skills, agents, MCP configs, or tracking tasks *within this repository*, follow that structure: new skills go in `claude/skills/` with YAML frontmatter, multi-agent setups go in `claude/agents/<name>/README.md`, MCP configs go in `claude/mcps/`, and active work items belong in `claude/tasks/task.md` — completed items are moved (never deleted) to `claude/tasks/done.md` with a date.
