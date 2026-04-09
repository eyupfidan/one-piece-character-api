# One Piece Character API (TypeScript)

High-availability One Piece API built with **TypeScript + Express + SQLite**.

## What this project provides
- SQLite-based local persistence (no MariaDB requirement)
- TypeScript codebase with modular folder structure
- Automatic bootstrap when local DB is empty/deleted
- Resilient ingestion: multi-source scrape + cache + fallback seed
- Rich API: pagination, search, stats, CSV/JSON export, full export
- Automatic port fallback (`PORT`, then `PORT+1`, ...)

## Project Structure

```txt
src/
  config/
    fallbackData.ts
  controllers/
    characterController.ts
    crewController.ts
    exportController.ts
  routes/
    characterRoutes.ts
    crewRoutes.ts
    exportRoutes.ts
  scheduler/
    dailyScraper.ts
  services/
    bootstrapService.ts
    cacheService.ts
    dbInitService.ts
    dbService.ts
    scrapingService.ts
  types/
    domain.ts
  utils/
    extractSection.ts
  server.ts
```

## Environment Variables
```env
PORT=3000
SQLITE_PATH=./data/onepiece.db
CRON_SCHEDULE=0 0 * * *
DETAIL_BATCH_SIZE=5
SCRAPER_TIMEOUT_MS=10000
```

## Local Development
```bash
npm install
npm run dev
```

## Build & Run
```bash
npm run build
npm run start:prod
```

## API Endpoints
### Characters
- `GET /api/character?limit=50&offset=0&q=luffy&includeDetails=true`
- `GET /api/character/:name`
- `GET /api/character/stats`
- `GET /api/character/export/json`
- `GET /api/character/export/csv`

### Crews
- `GET /api/crew?limit=50&offset=0&q=straw`
- `GET /api/crew/stats`
- `GET /api/crew/export/json`
- `GET /api/crew/export/csv`

### Full Export
- `GET /api/export/full/json`

## Data Flow Documentation
1. `dbInitService` creates/validates SQLite schema.
2. `bootstrapService` seeds from cache, then fallback seed data if DB is empty.
3. API starts and serves immediate responses.
4. `dailyScraper` runs in background:
   - tries live sources,
   - upserts characters/crews/details,
   - stores successful list data into cache.
5. On source failure (`403`, network), API continues serving bootstrap/cache data.

## Docker
```bash
docker build -t one-piece-character-api .
docker run -p 8000:8000 -v $(pwd)/data:/usr/src/app/data one-piece-character-api
```
