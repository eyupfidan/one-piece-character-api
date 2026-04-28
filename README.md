# One Piece Character API

A production-oriented REST API for One Piece character data, built with TypeScript, Express, and SQLite.

The service ingests the canon character and crew lists from the Fandom MediaWiki API, stores them locally, and exposes fast paginated endpoints for applications, dashboards, bots, and data export workflows. Character details are cached in SQLite and can be hydrated in the background or fetched on demand per character.

## Features

- Full canon character list ingestion through the MediaWiki API
- Local SQLite persistence with automatic schema initialization
- Fast startup with non-blocking background synchronization
- On-demand character detail hydration and optional forced refresh
- Paginated, searchable character and crew endpoints
- Character and crew statistics
- JSON and CSV export endpoints
- Full dataset export with joined character details
- Docker-ready production build
- No browser automation, Puppeteer, or external database required

## Tech Stack

- Runtime: Node.js
- Language: TypeScript
- API: Express
- Database: SQLite
- HTML parsing: Cheerio
- Scheduling: node-cron
- Data source: One Piece Fandom MediaWiki API

## Requirements

- Node.js 22 or newer
- npm
- SQLite support through Node's native `node:sqlite` module or the `sqlite3` CLI available on `PATH`

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The development server watches `src/server.ts` and restarts automatically.

## Production

```bash
npm run build
npm start
```

`npm start` runs the compiled output from `dist/server.js`.

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | Preferred HTTP port. If unavailable, the server tries the next ports. |
| `SQLITE_PATH` | `./data/onepiece.db` | SQLite database file path. |
| `CRON_SCHEDULE` | `0 0 * * *` | Cron expression for recurring sync jobs. |
| `SCRAPER_TIMEOUT_MS` | `10000` | HTTP timeout for source requests. |
| `SYNC_DETAILS_ON_START` | `true` | Enables background character detail hydration after list sync. |
| `DETAIL_CONCURRENCY` | `8` | Number of character detail requests processed in parallel. |
| `DETAIL_BATCH_DELAY_MS` | `100` | Delay between detail batches in milliseconds. |

Create a local `.env` file from `.env.example` when you need custom values.

## API Reference

### Characters

```http
GET /api/character
```

Query parameters:

| Parameter | Description |
| --- | --- |
| `limit` | Page size. Minimum `1`, maximum `200`, default `50`. |
| `offset` | Number of records to skip. |
| `q` | Case-insensitive name search. |
| `includeDetails` | Set to `true` to include selected detail fields. |

Examples:

```bash
curl 'http://localhost:3000/api/character?limit=20&offset=0'
curl 'http://localhost:3000/api/character?q=luffy&includeDetails=true'
```

### Character Detail

```http
GET /api/character/:name
GET /api/character/:name?refresh=true
```

Returns cached detail data when available. If a rich detail record is missing, the API fetches the character page, parses the infobox, stores the result, and returns it. Use `refresh=true` to force a new source fetch.

Example:

```bash
curl 'http://localhost:3000/api/character/Monkey%20D.%20Luffy'
```

### Character Stats

```http
GET /api/character/stats
```

Returns total character count, top letters, and year distribution.

### Sync Status

```http
GET /api/character/sync/status
```

Returns list and detail synchronization progress, including database totals.

### Crews

```http
GET /api/crew
GET /api/crew/stats
```

Crew list supports `limit`, `offset`, and `q` query parameters.

### Exports

```http
GET /api/character/export/json
GET /api/character/export/csv
GET /api/crew/export/json
GET /api/crew/export/csv
GET /api/export/full/json
```

`/api/export/full/json` returns characters, character details, and crews in one response.

## Data Synchronization

On startup, the service initializes the SQLite schema, seeds from cache or fallback data if needed, and starts a non-blocking source sync. The list sync stores the complete canon character and crew lists first, then optional detail hydration continues in the background.

For fast API startup in constrained environments, set:

```env
SYNC_DETAILS_ON_START=false
```

With that setting, the API still loads the full character and crew lists, while character details are fetched lazily the first time a detail endpoint is requested.

## Docker

```bash
docker build -t one-piece-character-api .
docker run --rm -p 8000:8000 -v "$(pwd)/data:/usr/src/app/data" one-piece-character-api
```

The container stores SQLite data under `/usr/src/app/data`.

## Project Structure

```txt
src/
  config/        Fallback seed data
  controllers/   HTTP request handlers
  routes/        Express routers
  scheduler/     Cron and synchronization orchestration
  services/      Database, cache, scraping, and detail hydration services
  types/         Shared TypeScript types
  utils/         HTML extraction helpers
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server with watch mode. |
| `npm run start:dev` | Start the TypeScript server once. |
| `npm run build` | Compile TypeScript to `dist/`. |
| `npm start` | Run the compiled production server. |
| `npm run typecheck` | Run TypeScript checks without emitting files. |
| `npm run clean` | Remove compiled output. |

## Notes

This project uses public wiki data. Source availability, page structure, or rate limits can change over time. The API keeps local data in SQLite so it can continue serving existing records even when the upstream source is temporarily unavailable.
