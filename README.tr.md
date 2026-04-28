# One Piece Character API

TypeScript, Express ve SQLite ile geliştirilen, production kullanımına uygun One Piece karakter API'si.

Servis, canon karakter ve ekip listelerini Fandom MediaWiki API üzerinden alır, yerel SQLite veritabanında saklar ve uygulamalar, dashboard'lar, botlar ve veri dışa aktarma akışları için hızlı REST endpointleri sunar. Karakter detayları SQLite içinde cache'lenir; arka planda toplu şekilde ya da karakter bazında istek geldiğinde anlık olarak doldurulabilir.

## Özellikler

- MediaWiki API üzerinden tam canon karakter listesi alma
- Otomatik şema kurulumu ile yerel SQLite kalıcılığı
- API açılışını bloklamayan arka plan senkronizasyonu
- İstek geldiğinde karakter detayını çekme ve cache'leme
- İsteğe bağlı zorunlu detay yenileme
- Sayfalama ve arama destekli karakter ve ekip endpointleri
- Karakter ve ekip istatistikleri
- JSON ve CSV dışa aktarma
- Karakter detaylarıyla birleştirilmiş tam veri export'u
- Docker uyumlu production build
- Puppeteer, browser automation veya harici veritabanı gerektirmez

## Teknoloji

- Runtime: Node.js
- Dil: TypeScript
- API: Express
- Veritabanı: SQLite
- HTML ayrıştırma: Cheerio
- Zamanlama: node-cron
- Veri kaynağı: One Piece Fandom MediaWiki API

## Gereksinimler

- Node.js 22 veya üzeri
- npm
- Node'un native `node:sqlite` modülü ya da `PATH` üzerinde erişilebilir `sqlite3` CLI

## Kurulum

```bash
npm install
```

## Geliştirme

```bash
npm run dev
```

Geliştirme sunucusu `src/server.ts` dosyasını izler ve değişikliklerde otomatik yeniden başlar.

## Production

```bash
npm run build
npm start
```

`npm start`, derlenmiş `dist/server.js` çıktısını çalıştırır.

## Ortam Değişkenleri

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `PORT` | `3000` | Tercih edilen HTTP portu. Doluysa sonraki portlar denenir. |
| `SQLITE_PATH` | `./data/onepiece.db` | SQLite veritabanı dosya yolu. |
| `CRON_SCHEDULE` | `0 0 * * *` | Periyodik senkronizasyon için cron ifadesi. |
| `SCRAPER_TIMEOUT_MS` | `10000` | Kaynak istekleri için HTTP timeout değeri. |
| `SYNC_DETAILS_ON_START` | `true` | Liste senkronizasyonundan sonra arka planda detay çekmeyi etkinleştirir. |
| `DETAIL_CONCURRENCY` | `8` | Paralel işlenecek karakter detayı sayısı. |
| `DETAIL_BATCH_DELAY_MS` | `100` | Detay batch'leri arasındaki bekleme süresi. |

Özel değerler kullanmak için `.env.example` dosyasından bir `.env` oluşturun.

## API Referansı

### Karakterler

```http
GET /api/character
```

Query parametreleri:

| Parametre | Açıklama |
| --- | --- |
| `limit` | Sayfa boyutu. Minimum `1`, maksimum `200`, varsayılan `50`. |
| `offset` | Atlanacak kayıt sayısı. |
| `q` | İsim üzerinde arama. |
| `includeDetails` | `true` verilirse seçili detay alanları listeye eklenir. |

Örnekler:

```bash
curl 'http://localhost:3000/api/character?limit=20&offset=0'
curl 'http://localhost:3000/api/character?q=luffy&includeDetails=true'
```

### Karakter Detayı

```http
GET /api/character/:name
GET /api/character/:name?refresh=true
```

Cache'te zengin detay kaydı varsa onu döner. Eksikse karakter sayfasını kaynaktan çeker, infobox verisini ayrıştırır, SQLite'a yazar ve sonucu döner. `refresh=true` parametresi kaynak üzerinden yeniden çekmeye zorlar.

Örnek:

```bash
curl 'http://localhost:3000/api/character/Monkey%20D.%20Luffy'
```

### Karakter İstatistikleri

```http
GET /api/character/stats
```

Toplam karakter sayısını, harf dağılımını ve yıl dağılımını döner.

### Senkronizasyon Durumu

```http
GET /api/character/sync/status
```

Liste ve detay senkronizasyon ilerlemesini, hata bilgisini ve veritabanı toplamlarını döner.

### Ekipler

```http
GET /api/crew
GET /api/crew/stats
```

Ekip listesi `limit`, `offset` ve `q` parametrelerini destekler.

### Dışa Aktarma

```http
GET /api/character/export/json
GET /api/character/export/csv
GET /api/crew/export/json
GET /api/crew/export/csv
GET /api/export/full/json
```

`/api/export/full/json`, karakterleri, karakter detaylarını ve ekipleri tek response içinde döner.

## Veri Senkronizasyonu

Uygulama açıldığında SQLite şeması hazırlanır, gerekiyorsa cache veya fallback veriyle başlangıç verisi yazılır ve kaynak senkronizasyonu arka planda başlatılır. Önce tam karakter ve ekip listeleri yazılır; ardından ayara bağlı olarak karakter detayları arka planda doldurulur.

Kaynak kısıtlı ortamlarda API'nin hızlı açılması için:

```env
SYNC_DETAILS_ON_START=false
```

Bu ayarda API yine tam karakter ve ekip listelerini yükler. Karakter detayları ise ilgili detay endpoint'i ilk çağrıldığında lazy olarak çekilir.

## Docker

```bash
docker build -t one-piece-character-api .
docker run --rm -p 8000:8000 -v "$(pwd)/data:/usr/src/app/data" one-piece-character-api
```

Container içinde SQLite verisi `/usr/src/app/data` altında saklanır.

## Proje Yapısı

```txt
src/
  config/        Fallback başlangıç verisi
  controllers/   HTTP request handler'ları
  routes/        Express route tanımları
  scheduler/     Cron ve senkronizasyon orkestrasyonu
  services/      Database, cache, scraping ve detay servisleri
  types/         Ortak TypeScript tipleri
  utils/         HTML veri çıkarma yardımcıları
```

## Scriptler

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Watch mode ile geliştirme sunucusunu başlatır. |
| `npm run start:dev` | TypeScript sunucusunu tek sefer çalıştırır. |
| `npm run build` | TypeScript kodunu `dist/` klasörüne derler. |
| `npm start` | Derlenmiş production sunucusunu çalıştırır. |
| `npm run typecheck` | Dosya üretmeden TypeScript kontrolü yapar. |
| `npm run clean` | Derlenmiş çıktıları temizler. |

## Notlar

Bu proje public wiki verisini kullanır. Kaynak erişilebilirliği, sayfa yapısı veya rate limit davranışları zaman içinde değişebilir. API, mevcut kayıtları SQLite içinde tuttuğu için upstream kaynak geçici olarak erişilemez olsa bile var olan veriyi sunmaya devam eder.
