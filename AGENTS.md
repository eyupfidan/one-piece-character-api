# AGENTS.md

Repository-specific instructions for Codex and other coding agents working on this project.

## Project Summary

This repository is a TypeScript REST API for One Piece character data.

The API:

- runs on Node.js with Express;
- stores data in local SQLite;
- ingests canon character and crew lists from the One Piece Fandom MediaWiki API;
- parses character detail pages with Cheerio;
- exposes paginated/searchable endpoints, stats, JSON/CSV exports, full export, and sync status;
- does not require Puppeteer, browser automation, MariaDB, MySQL, or another external database.

Treat the application as a production-oriented backend service, not as a frontend app or a throwaway scraper.

## Runtime and Tooling

- Package manager: `npm`
- Runtime: Node.js 22 or newer
- Language: TypeScript
- Server framework: Express
- Database: SQLite
- Scheduler: `node-cron`
- Scraping/parser stack: Axios + Cheerio
- Build output: `dist/`

SQLite access is implemented in `src/services/dbService.ts`. It prefers Node's native `node:sqlite` module and falls back to the `sqlite3` CLI when native support is unavailable.

## Common Commands

Run these from the repository root.

```bash
npm install
npm run typecheck
npm run build
npm run dev
npm run start:dev
npm start
npm audit --audit-level=moderate
```

Command meaning:

- `npm run typecheck`: run TypeScript checks without emitting files.
- `npm run build`: compile TypeScript into `dist/`.
- `npm run dev`: start the watch-mode development server.
- `npm run start:dev`: start the TypeScript server once through `tsx`.
- `npm start`: run the compiled production server from `dist/server.js`.
- `npm audit --audit-level=moderate`: dependency security check.

Before finishing code changes, at minimum run:

```bash
npm run typecheck
npm run build
```

For dependency or package-lock changes, also run:

```bash
npm audit --audit-level=moderate
```

For server behavior changes, run a smoke test with an isolated SQLite path:

```bash
PORT=3320 SQLITE_PATH=/tmp/onepiece-agent-smoke.db SYNC_DETAILS_ON_START=false npm start
curl -sS 'http://127.0.0.1:3320/api/character?limit=1'
curl -sS 'http://127.0.0.1:3320/api/character/sync/status'
```

Stop any server process you start before ending your task unless the user explicitly asks you to leave it running.

## Environment

Supported environment variables are documented in `.env.example` and `README.md`.

Important defaults:

- `PORT=3000`
- `SQLITE_PATH=./data/onepiece.db`
- `CRON_SCHEDULE=0 0 * * *`
- `SCRAPER_TIMEOUT_MS=10000`
- `SYNC_DETAILS_ON_START=true`
- `DETAIL_CONCURRENCY=8`
- `DETAIL_BATCH_DELAY_MS=100`

Use temporary SQLite files under `/tmp` for tests and smoke runs. Do not rely on or modify a user's local `data/onepiece.db` unless the task explicitly requires it.

## Repository Layout

```txt
src/
  config/        fallback seed data
  controllers/   Express request handlers
  routes/        Express router definitions
  scheduler/     cron and sync orchestration
  services/      database, cache, scraping, bootstrap, and detail hydration
  types/         shared TypeScript domain types
  utils/         HTML extraction helpers

config/
  database.sql   SQLite schema and indexes
```

Key files:

- `src/server.ts`: app startup, database initialization, bootstrap, and initial sync launch.
- `src/scheduler/dailyScraper.ts`: list sync, detail sync, stale row cleanup, cron scheduling, and sync status state.
- `src/services/scrapingService.ts`: MediaWiki API ingestion and list/detail page retrieval.
- `src/services/characterDetailService.ts`: character infobox parsing and detail upsert logic.
- `src/services/dbService.ts`: SQLite query abstraction and runtime backend selection.
- `src/services/bootstrapService.ts`: local DB bootstrap from cache or fallback seed data.
- `src/services/cacheService.ts`: source cache read/write helpers.
- `config/database.sql`: schema and indexes.

## Data Ingestion Rules

The canonical source for lists is the Fandom MediaWiki API, not the rendered Fandom HTML page.

Use:

```txt
https://onepiece.fandom.com/api.php?action=parse&...
```

Avoid reintroducing:

- Puppeteer;
- Playwright/browser scraping for ingestion;
- Cloudflare-bypassing code;
- MariaDB/MySQL clients;
- direct scraping of Fandom browser pages as the primary list source.

The rendered Fandom site can return Cloudflare/captcha pages. The MediaWiki API is more stable for this project and is the intended source path.

## Database Rules

- Keep schema changes in `config/database.sql`.
- Preserve idempotent DDL: use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.
- Use parameterized queries through `query()` from `src/services/dbService.ts`.
- Do not add raw string interpolation for user-provided values.
- Keep local SQLite files out of git. They are ignored through `.gitignore` and `.dockerignore`.
- Prefer upserts for source data refreshes.
- If source list sync succeeds with a full list, stale rows can be pruned. Avoid pruning when only fallback data is available.

## API Behavior

Current public route groups:

- `/api/character`
- `/api/crew`
- `/api/export`

Important endpoints:

- `GET /api/character?limit=50&offset=0&q=luffy&includeDetails=true`
- `GET /api/character/:name`
- `GET /api/character/:name?refresh=true`
- `GET /api/character/stats`
- `GET /api/character/sync/status`
- `GET /api/crew?limit=50&offset=0&q=straw`
- `GET /api/crew/stats`
- `GET /api/export/full/json`

Maintain backward-compatible response shapes unless the user explicitly asks for an API change.

## Performance Guidelines

- Keep startup fast. Initial list sync should not block HTTP startup longer than necessary.
- Use `SYNC_DETAILS_ON_START=false` for smoke tests and local verification when full detail hydration is not under test.
- Keep detail hydration concurrent but bounded through `DETAIL_CONCURRENCY`.
- Avoid large synchronous loops in request handlers.
- Keep expensive external fetches out of list endpoints.
- Character detail endpoints may fetch missing detail data on demand and then cache it in SQLite.
- Use indexes for fields involved in frequent lookups or joins.

## Error Handling Guidelines

- Source failures should not crash the API.
- Preserve fallback behavior for startup/bootstrap.
- Log upstream failures with enough context to diagnose the source and character/page involved.
- Return stable JSON error objects from controllers.
- Do not expose stack traces or raw dependency errors in API responses.

## Documentation Rules

- `README.md` is the default English documentation.
- `README.tr.md` is the Turkish documentation.
- Do not recreate `README.en.md`.
- Keep README examples aligned with actual scripts and routes.
- Update `.env.example` when environment variables are added, removed, or renamed.

## Docker Rules

- Keep Docker build context small through `.dockerignore`.
- Do not copy local `data/`, `.env`, `node_modules`, `dist`, editor folders, or logs into the Docker build context.
- The Docker image should build from source and run compiled output.
- Runtime SQLite data belongs under `/usr/src/app/data`.

## Git Hygiene

Do not commit generated or local-only artifacts:

- `node_modules/`
- `dist/`
- `data/`
- `.env`
- `.idea/`
- `.vscode/`
- logs
- coverage output
- SQLite database files

Before committing, inspect:

```bash
git status --short
git diff --check
git diff --stat
```

Do not revert user changes unless explicitly instructed. If the worktree is dirty, understand whether the changes are part of the current task before editing related files.

## Coding Style

- Follow the existing TypeScript style.
- Keep modules small and focused.
- Prefer explicit exported functions over default-heavy utility modules unless matching existing patterns.
- Use `async`/`await` consistently.
- Keep controller logic thin; place data fetching/parsing/persistence logic in services.
- Do not add broad abstractions unless they remove real duplication or clarify an existing boundary.
- Keep comments sparse and useful.

## Adding Dependencies

Only add dependencies when they clearly reduce maintenance burden or improve correctness.

Before adding a package:

- check whether the existing stack can solve the problem;
- consider Docker/runtime impact;
- update `package-lock.json` through npm;
- run `npm audit --audit-level=moderate`;
- document any new operational requirement.

## Testing and Verification

There is currently no unit test suite. Use these verification layers:

1. TypeScript checks:

```bash
npm run typecheck
```

2. Production build:

```bash
npm run build
```

3. Security audit when dependencies changed:

```bash
npm audit --audit-level=moderate
```

4. Runtime smoke test for API/server changes:

```bash
PORT=3320 SQLITE_PATH=/tmp/onepiece-agent-smoke.db SYNC_DETAILS_ON_START=false npm start
curl -sS 'http://127.0.0.1:3320/api/character?limit=1'
curl -sS 'http://127.0.0.1:3320/api/crew?limit=1'
curl -sS 'http://127.0.0.1:3320/api/character/sync/status'
```

If a command cannot be run, state why in the final response.

## Expected Agent Workflow

1. Inspect relevant files before editing.
2. Keep changes scoped to the user's request.
3. Update documentation and `.env.example` when behavior or configuration changes.
4. Run the appropriate verification commands.
5. Summarize changed files and verification results clearly.

