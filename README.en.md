# One Piece Character API (English)

Lightweight REST API that stores One Piece data in SQLite and keeps it fresh with scheduled scraping.

## Features
- Express REST API
- SQLite local persistence (`data/onepiece.db`)
- Fast startup with automatic seed bootstrap after local DB deletion
- Daily background sync with cron
- Character and crew listing, details, and export endpoints
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

## API Endpoints
### Characters
- `GET /api/character?limit=50&offset=0&q=luffy`
- `GET /api/character/:name`
- `GET /api/character/export/json`
- `GET /api/character/export/csv`

### Crews
- `GET /api/crew?limit=50&offset=0&q=straw`
- `GET /api/crew/export/json`
- `GET /api/crew/export/csv`

## Reliability Notes
- If scraping returns `403`, the app tries multiple sources automatically.
- If all external sources fail, the API uses an internal seed dataset so requests still return usable data.
- If the local SQLite file is deleted, the app re-seeds core data on startup automatically.
