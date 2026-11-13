# Prompt 01 — Scaffold the repo (Astro site + lead API workspaces)

> Local only. Nothing in this prompt touches the VPS, DNS or any live service.

---

## Context

We're building **Household Rebates** (householdrebates.com.au): a Victoria-first, independent guide to Victorian Energy Upgrades (VEU) discounts for reverse-cycle air conditioning and heat pump hot water, plus the 1 March 2027 gas hot water rule. Static Astro site served by nginx from `/var/www/householdrebates/current`, plus a tiny Node lead API on `127.0.0.1:8787` (SQLite, email via an existing mailbox). Publisher: Agenor Services Pty Ltd. Australian English throughout. The full design is in `solution-design.md` (Guri will give you this file — copy it to `docs/solution-design.md`).

## Rules

- Don't add any paid service, analytics script, web font CDN or third-party JS.
- Don't put secrets in the repo. `.env*` files are git-ignored; provide `.env.example` only.
- Use the current stable Astro (v6 at the time of writing). If `npm create astro@latest` installs a different major version, stop and tell Guri before continuing.

## Goal

A private Git repo `householdrebates` with npm workspaces `site/` (Astro) and `api/` (Node + Fastify + TypeScript), lint/format/test tooling, CI, and empty-but-building skeletons.

## Steps

1. `mkdir householdrebates && cd householdrebates && git init -b main`.
2. Root `package.json`:
   ```json
   {
     "name": "householdrebates",
     "private": true,
     "workspaces": ["site", "api"],
     "engines": { "node": ">=22.12" },
     "scripts": {
       "dev": "npm run dev -w site",
       "build": "npm run build -w site && npm run build -w api",
       "check": "npm run check -w site && npm run check -w api",
       "test": "npm run test -w site && npm run test -w api"
     }
   }
   ```
   `.nvmrc` → the major Node version prompt 00 found on the VPS (22 or 24). `.editorconfig`, `.gitattributes` (`* text=auto eol=lf`), `.gitignore` (node_modules, dist, .astro, .env*, !.env.example, *.db, *.db-*).
3. Site: `npm create astro@latest site -- --template minimal --typescript strict --no-install --no-git`, then `npm install`. Add `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/check`, `typescript`, `vitest`, `@playwright/test`.
4. `site/astro.config.mjs`:
   ```js
   import { defineConfig } from 'astro/config';
   import mdx from '@astrojs/mdx';
   import sitemap from '@astrojs/sitemap';
   export default defineConfig({
     site: 'https://householdrebates.com.au',
     output: 'static',
     trailingSlash: 'always',
     build: { format: 'directory', inlineStylesheets: 'never' },
     integrations: [mdx(), sitemap()],
   });
   ```
5. Site scripts: `dev`, `build` (`astro build`), `preview`, `check` (`astro check && vitest run`), `test` (`vitest run`), `e2e` (`playwright test`).
6. API: `api/package.json` with `fastify`, `better-sqlite3`, `nodemailer`; dev deps `typescript`, `tsx`, `vitest`, `@types/node`, `@types/better-sqlite3`, `@types/nodemailer`. Scripts: `dev` (`tsx watch src/server.ts`), `build` (`tsc -p .`), `check` (`tsc --noEmit && vitest run`), `test` (`vitest run`). `tsconfig.json` → `outDir: dist`, `module`/`moduleResolution: NodeNext`, `strict: true`.
7. `api/src/server.ts`: Fastify on `HOST`/`PORT` from env (default `127.0.0.1:8787`) with only `GET /health` → `{ "ok": true }`. `api/.env.example` lists every key from solution-design §8.4 with placeholder values and `LEADS_ENABLED=false`.
8. `ops/` folder with empty placeholders: `nginx/`, `systemd/`, `logrotate/`, `reports/`, and a `README.md` saying "filled in by prompts 08–09".
9. `docs/solution-design.md` (copy) and `docs/decisions.md` (empty log: date, decision, who).
10. `.github/workflows/ci.yml`: on push/PR → checkout, setup-node from `.nvmrc`, `npm ci`, `npm run check`, `npm run build`. No deploy step, ever.
11. Prettier with `prettier-plugin-astro`; ESLint optional (keep it light).
12. First commit: `chore: scaffold site and api workspaces`.

## Files created

`package.json`, `.nvmrc`, `.editorconfig`, `.gitattributes`, `.gitignore`, `site/**` (Astro minimal), `api/package.json`, `api/tsconfig.json`, `api/src/server.ts`, `api/.env.example`, `ops/README.md`, `docs/solution-design.md`, `docs/decisions.md`, `.github/workflows/ci.yml`, `.prettierrc`.

## Acceptance checks

```bash
npm ci                      # expect: exit 0
npm run check               # expect: astro check "0 errors", vitest "no test files" or pass, tsc no output
npm run build               # expect: site/dist/index.html exists; api/dist/server.js exists
ls site/dist/index.html api/dist/server.js
(cd site && npx astro --version)   # expect: 6.x (or tell Guri)
(cd api && PORT=8787 node dist/server.js &) ; sleep 1; curl -s http://127.0.0.1:8787/health; kill %1 2>/dev/null
# expect: {"ok":true}
git status --short          # expect: clean after commit
grep -rnE "(SMTP_PASS|CLIENT_SECRET)=[^<]" --include=*.env* . || echo "no secrets"   # expect: no secrets
```

## What to test

- `npm run dev` serves http://localhost:4321/ with the minimal page.
- CI passes on GitHub after the first push.

## STOP — Guri must approve

Creating the GitHub repo and pushing: ask Guri for the repo name/owner (suggest private `microforgeai/householdrebates`) before `gh repo create` or `git push`.
