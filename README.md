# Surface Scan

Cloudflare Workers üzerinde çalışan, tamamen **pasif** bir web güvenlik kontrol aracı. Alan adını girin; HTTP başlıkları, cookie bayrakları, TLS erişimi, `security.txt`/`robots.txt`, DNS (SPF, DMARC, CAA), alt alan adları (crt.sh) ve teknoloji izleri kontrol edilir. Sonuç 0-100 arası bir skor ve görsel bir raporla sunulur.

> **Uyarı:** Yalnızca sahibi olduğunuz veya yazılı izin aldığınız alan adlarını tarayın.

Geliştirici: **Ferdi Birgül**

## Rapor neleri gösterir
- Animasyonlu skor halkası ve kategori bazlı **radar grafik**
- Bulguların önem dağılımını gösteren **halka grafik**
- Güvenlik başlıkları için renkli **durum haritası**
- Bulunan alt alan adları ve teknolojiler
- Eksik başlıklar için kopyalanabilir **hazır `_headers` kodu**
- JSON indirme ve **PDF / yazdır** çıktısı

## Yapılmayanlar (bilinçli)
Port tarama, brute force, zafiyet sömürme ve benzeri aktif testler yoktur. Araç yalnızca herkese açık bilgileri okur. Pasif tarama tam bir güvenlik testinin (sızma testi) yerini tutmaz.

## Kurulum

```bash
npm install
npm run dev      # yerel geliştirme (http://localhost:8787)
npm run deploy   # Cloudflare'e yayınla (wrangler login gerekir)
```

## Uç noktalar

```
GET /api/scan?domain=ornek.com   # tarama
GET /api/health                  # durum ve rate limit türü
```

Tarama yanıtı: `{ domain, score, summary, findings[], subdomains[], technologies[], notes[] }`

`notes` alanı, sonuçların eksik olabileceği durumları (site botları engelliyor, crt.sh yanıt vermedi vb.) açıklar.

## Yayına almadan önce kontrol listesi

1. **Rate limit çalışıyor mu?** `wrangler.toml` içindeki limit `unsafe` bir tanımdır. Yayından sonra:
   ```bash
   node scripts/ratelimit-test.mjs https://SENIN-ADRESIN.workers.dev
   ```
   İlk 5 istek `200`, sonrakiler `429` dönmeli. `/api/health` yanıtında `rateLimiter` alanı `cloudflare-binding` ise Cloudflare limiti aktiftir, `yerel-yedek` ise yalnızca Worker örneği başına çalışan yedek limit kullanılıyordur. İkinci durumda Cloudflare panelinden bir rate limiting kuralı ekleyin.
2. **Ücretsiz plan CPU sınırı.** Workers ücretsiz planında istek başına CPU süresi kısıtlıdır. Yanıt okuma boyutları sınırlandırıldı, yine de yayından sonra panelde hata oranına bakın.
3. **İsim ve marka.** "Surface", bilinen bir ürün serisinin de adıdır. Alan adı, GitHub ve sosyal medya adını kontrol edin; büyütmeyi düşünüyorsanız marka araması yapın.
4. **Kendi sitenizi tarayın.** Yayınladığınız adresi aracın kendisiyle tarayıp başlıkların geldiğini doğrulayın.
5. **`security.txt` ekleyin.** `docs/security.txt.example` dosyasını kendi bilgilerinizle doldurup sitenizde `/.well-known/security.txt` olarak yayınlayın.

## Güvenlik önlemleri
- Alan adı doğrulama (regex, IP ve iç ağ uzantıları reddedilir)
- SSRF koruması: alan adı DoH ile çözülür, özel/loopback IP'ye işaret ediyorsa reddedilir
- IP başına rate limit (Cloudflare bağlantısı yoksa yerel yedek)
- Yanıt gövdeleri boyut sınırıyla okunur (CPU ve bellek koruması)
- Site taramayı engelliyorsa yanlış "eksik" bulgusu üretilmez
- Arayüzde tüm uzak içerik `textContent` ile yazılır (XSS yok)
- Statik sayfalarda CSP, HSTS, X-Frame-Options vb. başlıklar
- Her dış istek için zaman aşımı

## Yol haritası
- Cookie/başlık kontrollerini ek sayfalarda da çalıştırma
- TLS protokol/şifre seti bilgisi (harici API ile)
- React/TypeScript/Tailwind arayüzü

## Lisans
MIT, bkz. `LICENSE`.
