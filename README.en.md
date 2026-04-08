# One Piece Character API (English)

Lightweight REST API that scrapes One Piece character data and stores it in SQLite.

## Features
- Express REST API
- SQLite local persistence (`data/onepiece.db`)
- Daily background sync with cron
- Character list, crew list, character detail endpoints
- Automatic port fallback (`3000` -> `3001` -> ...)

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

## Endpoints
- `GET /api/character`
- `GET /api/character/:name`
- `GET /api/crew`

## Notes
- If scraping returns `403`, this is usually Cloudflare bot protection from the target site.
- API still starts and serves existing DB data.
