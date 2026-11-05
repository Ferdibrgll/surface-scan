<div align="center">

# 🛡️ SurfaceScan

### Web sitenizin güvenlik görünürlüğü, tek bir raporda.

**Cloudflare Workers üzerinde çalışan, pasif web güvenliği analiz aracı.**  
Alan adınızın herkese açık güvenlik yapılandırmasını inceleyin, bulguları önceliklendirin ve uygulanabilir iyileştirme önerileri alın.

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
![License: MIT](https://img.shields.io/badge/License-MIT-22c55e)
![Analysis](https://img.shields.io/badge/Analiz-Pasif-00bcd4)
![Language](https://img.shields.io/badge/Dil-T%C3%BCrk%C3%A7e-3b82f6)

**Geliştirici: [Ferdi Birgül](https://ferdibirgul.com/)**

</div>

---

## ✨ Proje hakkında

**SurfaceScan**, web sitelerinin dışarıdan görülebilen güvenlik yapılandırmalarını **aktif saldırı gerçekleştirmeden** değerlendirmek için geliştirdiğim bir projedir. Amaç; teknik ekiplerin, geliştiricilerin ve site sahiplerinin güvenlik başlıkları, DNS kayıtları, HTTPS erişimi ve diğer temel göstergeleri tek bir arayüzden inceleyebilmesidir.

Bir alan adı girildiğinde araç, erişebildiği herkese açık verileri kontrol eder ve **0–100 arası bir değerlendirme skoru**, bulgular ve iyileştirme önerileri oluşturur. Bu skor yalnızca aracın kontrol ettiği maddelere dayanır; bir sitenin bütünüyle güvenli olduğunu kanıtlamaz.

> [!IMPORTANT]
> **Yetkili kullanım:** Yalnızca sahibi olduğunuz veya tarama izni aldığınız alan adlarını kontrol edin. SurfaceScan, kapsamlı bir sızma testinin yerine geçmez.

## 🖥️ Arayüzden görüntüler

### Ana sayfa ve örnek güvenlik raporu

![SurfaceScan ana sayfa ve örnek rapor tasarımı](assets/readme/hero.png)

### Saldırı yüzeyi görünümü

![SurfaceScan saldırı yüzeyi ve DNS e-posta kontrolleri](assets/readme/attack-surface.png)

> Görseller, projenin kullanıcı arayüzünü ve **temsili** rapor verilerini göstermektedir. Görsellerde yer alan puan ve bulgular gerçek bir alan adına ait doğrulanmış sonuçlar değildir.

## 🔍 Neleri kontrol eder?

| Kategori | Kontroller |
| :-- | :-- |
| **HTTP güvenlik başlıkları** | HSTS, CSP, X-Frame-Options ve diğer başlıklar |
| **TLS / HTTPS** | HTTPS erişimi ve gözlemlenebilen bağlantı bilgileri |
| **Cookie güvenliği** | `Secure`, `HttpOnly`, `SameSite` bayrakları |
| **DNS ve e-posta** | SPF, DMARC, CAA kayıtları |
| **Güvenlik dosyaları** | `/.well-known/security.txt`, `robots.txt` |
| **Alt alan adları** | crt.sh sertifika şeffaflığı kayıtlarına dayalı keşif |
| **Teknoloji izleri** | Yanıtlarda görülebilen sunucu / uygulama teknolojisi ipuçları |

*Bazı kontroller, hedef sitenin erişilebilirliğine ve harici veri servislerinin yanıtlarına bağlı olarak eksik kalabilir. Bu durumlar raporun `notes` alanında belirtilir.*

## 📊 Rapor özellikleri

- **0–100 güvenlik skoru** ve animasyonlu skor göstergesi
- Kategori bazlı **radar grafik**
- Bulgu önem düzeyleri için **halka grafik**
- Güvenlik başlıkları için **durum haritası**
- Tespit edilebilen **alt alan adları ve teknoloji izleri**
- Eksik başlıklar için kopyalanabilir örnek **`_headers` yapılandırması**
- **JSON dışa aktarma**, **PDF / yazdırma** seçeneği
- Yanıt alınamayan kontroller için **belirsizlik / eksik veri notları**

## ⚙️ Nasıl çalışır?

```text
Kullanıcı alan adını girer
          │
          ▼
Alan adı doğrulaması + DNS/IP güvenlik kontrolleri
          │
          ▼
Herkese açık HTTP / HTTPS / DNS / crt.sh verilerinin okunması
          │
          ▼
Bulguların kategorilere ayrılması ve skor hesaplanması
          │
          ▼
Görsel rapor + iyileştirme önerileri + JSON/PDF çıktısı
```

**SurfaceScan; port taraması, brute force, kimlik doğrulama denemesi veya zafiyet sömürüsü yapmaz.** Pasif yaklaşım, her koşulda sıfır ağ trafiği anlamına gelmez: araç, herkese açık uç noktalara normal HTTP/DNS sorguları gönderebilir.

## 🧰 Kullanılan teknolojiler

| Bileşen | Teknoloji / yaklaşım |
| :-- | :-- |
| Çalışma ortamı | Cloudflare Workers |
| Geliştirme / dağıtım | Node.js, npm, Wrangler |
| Web arayüzü | Koyu tema, görsel güvenlik raporları |
| DNS sorguları | DNS-over-HTTPS (DoH) |
| Alt alan keşfi | crt.sh |
| API çıktısı | JSON |

## 🚀 Yerel kurulum

**Gereksinimler:** Node.js ve npm. Cloudflare'a dağıtım için bir Cloudflare hesabı ve Wrangler oturumu gerekir.

```bash
# Depoyu klonlayın (kendi depo URL'nizle değiştirin)
git clone <REPO_URL>
cd <REPO_KLASORU>

# Bağımlılıkları kurun
npm install

# Yerel geliştirme sunucusunu başlatın
npm run dev
```

Yerel adres: **http://localhost:8787**

### Cloudflare Workers'a dağıtım

```bash
npx wrangler login
npm run deploy
```

> Dağıtımdan önce Worker yapılandırmasını ve `wrangler.toml` dosyasındaki bağlayıcıları kontrol edin.

## 🔌 API uç noktaları

| Metot | Uç nokta | Açıklama |
| :-- | :-- | :-- |
| `GET` | `/api/scan?domain=ornek.com` | Belirtilen alan adını analiz eder |
| `GET` | `/api/health` | Servis durumu ve rate limit bilgisini döndürür |

Örnek istek:

```bash
curl "http://localhost:8787/api/scan?domain=ornek.com"
```

Örnek yanıt **şeması** (değerler temsili):

```json
{
  "domain": "ornek.com",
  "score": 82,
  "summary": {},
  "findings": [],
  "subdomains": [],
  "technologies": [],
  "notes": []
}
```

Gerçek alanların içerikleri ve bulgular, analiz edilen domaine göre değişir.

## 🔐 Güvenlik ve kullanım sınırları

- Alan adı doğrulaması yapılır; IP adresleri ve iç ağ uzantıları reddedilir.
- SSRF riskine karşı alan adları DoH ile çözülür; özel ve loopback adreslere yönlendirme engellenmeye çalışılır.
- İsteklerde zaman aşımı ve yanıt gövdelerinde boyut sınırı uygulanır.
- Uzak içerik arayüze `textContent` ile yerleştirilerek HTML olarak yorumlanması önlenir.
- Statik sayfalarda güvenlik başlıkları kullanılır.
- Rate limiting uygulanır; **yerel yedek limit tek başına dağıtık ortamda yeterli koruma sağlamaz**.
- Hedef site erişimi engelliyorsa, yanıltıcı kesin güvenlik bulguları oluşturulmaması amaçlanır.

### Yayından önce rate limit testi

```bash
node scripts/ratelimit-test.mjs https://SENIN-ADRESIN.workers.dev
```

Projede yapılandırılmış 5 istek sınırı senaryosunda ilk isteklerin `200`, sınır aşıldığında `429` dönmesi beklenir. **Gerçek sonuçlar yapılandırma ve test koşullarına bağlıdır.**

`GET /api/health` yanıtındaki `rateLimiter` alanı:

- `cloudflare-binding`: Cloudflare rate limiter bağlantısı aktif.
- `yerel-yedek`: Yalnızca Worker örneği içinde çalışan yedek limit; ayrıca Cloudflare tarafında kural tanımlanmalıdır.

Ayrıca `docs/security.txt.example` şablonunu kendi iletişim bilgilerinizle düzenleyip `/.well-known/security.txt` yolunda yayınlayın.

## 🗺️ Yol haritası

- [ ] Başlık ve cookie kontrollerini belirli ek sayfalarda gerçekleştirme
- [ ] Harici veri kaynağı ile gelişmiş TLS protokol / şifre takımı görünürlüğü
- [ ] React, TypeScript ve Tailwind tabanlı arayüz yenilemesi

*Yol haritasındaki özellikler plan aşamasındadır; mevcut işlevler olarak değerlendirilmemelidir.*

## 👨‍💻 Geliştirici hakkında

**Ferdi Birgül**  
*IT Support & Network Security Specialist*

Ağ altyapısı, sistem yönetimi, teknik destek ve siber güvenlik üzerine çalışan bir bilişim profesyoneliyim. **SurfaceScan** projesini, web güvenliğiyle ilgili temel kontrolleri herkesin anlayabileceği görsel bir raporda birleştirmek ve güvenliğe yönelik farkındalığı artırmak amacıyla geliştirdim.

Bu proje, güvenlik bilgilerini yalnızca toplamakla kalmayıp **anlaşılır, izlenebilir ve geliştirilebilir** hale getirme yaklaşımımın bir parçasıdır.

🌐 **Web sitesi / Portföy:** [ferdibirgul.com](https://ferdibirgul.com/)

## 📄 Lisans

Bu proje **MIT Lisansı** altında sunulur. Ayrıntılar için [`LICENSE`](LICENSE) dosyasına bakın.

---

<div align="center">

**SurfaceScan · Güvenliği görünür kıl.**

Geliştiren: **Ferdi Birgül** © 2026

</div>
