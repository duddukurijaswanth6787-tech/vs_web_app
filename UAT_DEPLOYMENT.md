# UAT Deployment — Status & Handoff

Last updated: 2026-08-12

## Live URLs

| Piece | URL |
|---|---|
| Frontend (Vercel) | https://vsss-frontend.vercel.app |
| Backend (Railway) | https://secure-quietude-production-afa9.up.railway.app |
| Health check | https://secure-quietude-production-afa9.up.railway.app/health |
| Swagger (UAT only) | https://secure-quietude-production-afa9.up.railway.app/api/docs |

## Architecture

- **Frontend** — Next.js 16 on Vercel. Root directory `frontend`. Auto-deploys from `main`.
- **Backend** — NestJS 11 on Railway as a long-running server (NOT serverless). Root directory `backend`, Dockerfile builder.
- **Database** — Railway Postgres plugin. Migrations run automatically via the Railway pre-deploy step.
- **Redis / BullMQ** — Railway Redis plugin. Required: the app refuses to boot in production with `ENABLE_REDIS=false`.
- **Storage** — AWS S3. Required: the app refuses to boot in production unless `STORAGE_PROVIDER=s3`.

## Status

Done:
- Backend deployed, healthy. `/health` reports database, redis, queue, and S3 storage all `up`.
- Frontend deployed and rendering.
- CORS configured — the Vercel origin is allowed; preflight verified.
- Migrations applied (12).
- No `localhost` URLs remain in the UAT configuration.

Remaining:
- **Seed the database.** It is empty: `/api/v1/products` returns 0 rows, `/api/v1/settings/public` returns 422
  "Website settings not found", and login returns 401 because no user exists.

## How to finish: seeding

The seed creates the admin user, website settings, categories, a brand, warehouse, homepage
sections, footer, social links, feature toggles, a CMS page, and attributes. It uses `upsert`
throughout, so re-running it is safe.

1. Railway → Postgres service → Settings → Networking → **Add Public Access** (if not already on).
2. Railway → Postgres service → Variables → copy `DATABASE_PUBLIC_URL`.
   It must contain `proxy.rlwy.net`, NOT `railway.internal` — the internal hostname only
   resolves inside Railway's network and will fail with `P1001` from a laptop.
3. Run, from the `backend` directory:

   ```powershell
   cd <repo>\backend
   npm install
   $env:DATABASE_URL="<DATABASE_PUBLIC_URL>"; npx prisma db seed
   ```

4. **Remove public access again** once seeding succeeds (Postgres → Settings → Networking → trash icon).
   Leaving it on exposes the database to the public internet.

Then log in at https://vsss-frontend.vercel.app/login with `admin@vasanthi.com` / `Admin@123`
(the default in `backend/prisma/seed.ts`) and **change the password immediately** — it is a
published default on a publicly reachable site. Admin panel: `/admin`.

## Environment variables

Never commit these. `.env` and `.env.local` are gitignored; only `.env.example` templates are tracked.

**Vercel (frontend)**
```
NEXT_PUBLIC_API_BASE_URL=https://secure-quietude-production-afa9.up.railway.app/api/v1
NEXT_PUBLIC_HEALTH_URL=https://secure-quietude-production-afa9.up.railway.app/health
```

**Railway (backend)** — `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` are set as
Railway variable references (`${{Postgres.DATABASE_URL}}` etc.), not literals.
```
NODE_ENV=production
PORT=8080
JWT_SECRET / JWT_EXPIRES_IN / JWT_REMEMBER_ME_EXPIRES_IN /
JWT_REFRESH_TOKEN_EXPIRY_DAYS / JWT_ISSUER
CORS_ORIGIN=https://vsss-frontend.vercel.app
STORAGE_PROVIDER=s3
AWS_REGION / AWS_S3_BUCKET / AWS_S3_PUBLIC_URL / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
PAYMENT_PROVIDER=dummy
ENABLE_REDIS=true
ENABLE_BULLMQ=true
ENABLE_SWAGGER=true
RAG_ENABLED=false
```

## Deployment gotchas found the hard way

1. **Never put `npx` in the Railway start command.** `npx` does not exit without a TTY, so
   `npx prisma migrate deploy && node dist/src/main.js` hung forever: migrations ran, the app never
   started, the container stayed alive, and nothing was logged. Migrations now run as a
   pre-deploy step (`./node_modules/.bin/prisma migrate deploy`) and the start command is plain
   `node dist/src/main.js`.
2. `prisma` must stay in `dependencies`, not `devDependencies` — `npm prune --production` in the
   Dockerfile would otherwise strip the CLI needed for migrations.
3. Build output is `dist/src/main.js` (not `dist/main.js`).
4. Railway's dashboard Start Command overrides `railway.json`. If the two disagree, the dashboard
   wins — check there first when a config change appears to be ignored.
5. `tsconfig-paths` is not needed at runtime: `nest build` already rewrites the `@common/*` style
   path aliases to relative requires. Adding `-r tsconfig-paths/register` breaks startup, because
   `tsconfig.json` is not copied into the runtime image.

## Cleanup before production

- Revert the debug instrumentation in `backend/src/main.ts`: `bufferLogs: false` and the
  `[STARTUP]` / `[BOOTSTRAP]` console.logs.
- Quiet boot-time route logging — it trips Railway's 500 logs/sec limit on startup.
- `ENABLE_SWAGGER=false` for production.
- Rotate any credentials that were exposed during setup.
- Fix the ~26 pre-existing eslint errors in backend test files (they do not block the build).
