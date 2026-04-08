# One Piece Character API (Türkçe)

One Piece karakter verilerini scrape edip SQLite üzerinde saklayan hafif bir REST API.

## Özellikler
- Express REST API
- SQLite local kalıcılık (`data/onepiece.db`)
- Cron ile günlük arka plan senkronizasyonu
- Karakter listesi, mürettebat listesi, karakter detay uçları
- Otomatik port fallback (`3000` -> `3001` -> ...)

## Kurulum
```bash
npm install
npm start
```

## Ortam Değişkenleri
```env
PORT=3000
SQLITE_PATH=./data/onepiece.db
CRON_SCHEDULE=0 0 * * *
DETAIL_BATCH_SIZE=5
SCRAPER_TIMEOUT_MS=10000
```

## Uçlar
- `GET /api/character`
- `GET /api/character/:name`
- `GET /api/crew`

## Notlar
- Scrape tarafında `403` görülmesi, genelde hedef sitenin Cloudflare bot korumasıdır.
- API yine de açılır ve DB'deki mevcut verileri sunar.
- Tüm dış kaynaklar 403 verirse uygulama otomatik olarak gömülü fallback seed verisini kullanır; uçlar boş dönmez.
