# One Piece Character API (TypeScript)

**TypeScript + Express + SQLite** ile hazırlanmış yüksek erişilebilirlik odaklı One Piece API.

## Projenin sağladıkları
- SQLite tabanlı yerel kalıcılık (MariaDB zorunlu değil)
- TypeScript kod tabanı ve modüler dosya yapısı
- Yerel DB silinse/boşalsa otomatik bootstrap
- Dayanıklı veri toplama: çoklu kaynak + cache + fallback seed
- Zengin API: sayfalama, arama, istatistik, CSV/JSON export, tam export
- Otomatik port fallback (`PORT`, sonra `PORT+1`, ...)

## Proje Yapısı

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

## Ortam Değişkenleri
```env
PORT=3000
SQLITE_PATH=./data/onepiece.db
CRON_SCHEDULE=0 0 * * *
DETAIL_BATCH_SIZE=5
SCRAPER_TIMEOUT_MS=10000
```

## Local Geliştirme
```bash
npm install
npm run dev
```

## Build ve Çalıştırma
```bash
npm run build
npm run start:prod
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

### Tam Export
- `GET /api/export/full/json`

## Veri Akışı Dokümantasyonu
1. `dbInitService` SQLite şemasını oluşturur/doğrular.
2. `bootstrapService`, DB boşsa önce cache’den, sonra fallback seed’den veri yazar.
3. API hızlıca ayağa kalkar ve anında yanıt verir.
4. `dailyScraper` arka planda çalışır:
   - canlı kaynakları dener,
   - karakter/mürettebat/detay verisini upsert eder,
   - başarılı liste verisini cache’e yazar.
5. Kaynaklar `403` veya ağ hatası verirse API cache/seed ile çalışmaya devam eder.

## Docker
```bash
docker build -t one-piece-character-api .
docker run -p 8000:8000 -v $(pwd)/data:/usr/src/app/data one-piece-character-api
```
