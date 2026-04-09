# One Piece Character API (Türkçe)

One Piece verilerini SQLite üzerinde tutan ve zamanlanmış scraping ile güncel tutan hafif bir REST API.

## Özellikler
- Express REST API
- SQLite local kalıcılık (`data/onepiece.db`)
- Yerel DB silindiğinde hızlı başlangıç için otomatik seed bootstrap
- Cron ile günlük arka plan senkronizasyonu
- Karakter/mürettebat liste, detay ve dışa aktarma endpointleri
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

## API Endpointleri
### Karakter
- `GET /api/character?limit=50&offset=0&q=luffy`
- `GET /api/character/:name`
- `GET /api/character/export/json`
- `GET /api/character/export/csv`

### Mürettebat
- `GET /api/crew?limit=50&offset=0&q=straw`
- `GET /api/crew/export/json`
- `GET /api/crew/export/csv`

## Güvenilirlik Notları
- Scraping tarafı `403` dönerse uygulama otomatik olarak birden fazla kaynağı dener.
- Tüm dış kaynaklar başarısız olursa API dahili seed verisini kullanır ve endpointler boş dönmez.
- Yerel SQLite dosyası silinirse uygulama başlangıçta çekirdek veriyi otomatik yeniden yazar.
