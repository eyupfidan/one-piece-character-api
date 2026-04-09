# One Piece Character API (Türkçe)

Yüksek erişilebilirlik için tasarlanmış; SQLite kalıcılığı, dayanıklı veri toplama, zengin dışa aktarma ve hızlı başlangıç bootstrap özelliklerine sahip One Piece API.

## Öne Çıkanlar
- DB silinse bile başlangıçta otomatik bootstrap ile hızlı veri hazırlama
- Çoklu kaynak scraping + otomatik seed fallback
- Sayfalama/arama destekli endpointler
- Zengin JSON + CSV dışa aktarma
- Tüm veriyi tek noktadan dışa aktaran endpoint
- Otomatik port fallback (`3000` → `3001` → ...)

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
- `GET /api/character?limit=50&offset=0&q=luffy&includeDetails=true`
- `GET /api/character/:name`
- `GET /api/character/stats`
- `GET /api/character/export/json`
- `GET /api/character/export/csv`

### Mürettebat
- `GET /api/crew?limit=50&offset=0&q=straw`
- `GET /api/crew/stats`
- `GET /api/crew/export/json`
- `GET /api/crew/export/csv`

### Genel Dışa Aktarma
- `GET /api/export/full/json`

## Güvenilirlik ve Performans
- Dış kaynaklar `403` döndürürse sistem alternatif kaynakları dener.
- Tüm kaynaklar başarısız olursa API, dahili seed verisiyle yanıt üretmeye devam eder.
- `data/onepiece.db` silinirse başlangıçta çekirdek veri otomatik ve hızlı şekilde yeniden yazılır.

## Çakışma Azaltma
- `.gitattributes` ile `package-lock.json` için merge çatışmaları azaltıldı (`merge=union`).
- Eski `README.md`, tekrar eden binary-diff PR sorunlarını önlemek için merge/diff dışına alındı.
