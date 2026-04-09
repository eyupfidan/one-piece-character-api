# One Piece Character API (English)

A high-availability One Piece API with SQLite persistence, resilient data ingestion, rich exports, and startup bootstrap.

## Highlights
- Fast startup with automatic local bootstrap after DB deletion
- Multi-source scraping + automatic fallback seed data
- Paginated/searchable endpoints
- Rich JSON + CSV exports
- Full consolidated export endpoint
- Automatic port fallback (`3000` → `3001` → ...)

## Setup
```bash
npm install
npm start
```

## Environment
```env
PORT=3000
SQLITE_PATH=./data/onepiece.db
CRON_SCHEDULE=0 0 * * *
DETAIL_BATCH_SIZE=5
SCRAPER_TIMEOUT_MS=10000
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

### Global Export
- `GET /api/export/full/json`

## Reliability & Performance
- If external sources return `403`, the system tries alternative sources.
- If all sources fail, internal seed data is used to keep the API responsive.
- If `data/onepiece.db` is deleted, bootstrap reseeds core data instantly at startup.

## Collaboration / Merge-conflict Reduction
- `.gitattributes` is configured to reduce lockfile merge conflicts (`package-lock.json merge=union`).
- Legacy `README.md` is marked as non-merge/non-diff to avoid recurring binary-diff PR issues.
