import { doh } from "./guard";
import type { Finding } from "./types";

const UA = "surfacescan-passive/0.1 (+passive security check; read-only)";

async function get(url: string, timeoutMs = 6000): Promise<Response | null> {
  try {
    return await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return null;
  }
}

// ---------- Ana sayfa: başlıklar, cookie, teknoloji ----------

// Gövdeyi sınırlı okur: büyük yanıtlar CPU süresini tüketmesin
async function readCapped(res: Response, maxBytes: number): Promise<{ text: string; truncated: boolean }> {
  if (!res.body) return { text: "", truncated: false };
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let received = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    text += decoder.decode(value, { stream: true });
    if (received >= maxBytes) {
      truncated = true;
      await reader.cancel();
      break;
    }
  }
  return { text, truncated };
}

export interface HomepageResult {
  findings: Finding[];
  technologies: string[];
  notes: string[];
  blocked: boolean; // site taramayı engelledi ya da ulaşılamadı: dosya kontrolleri doğrulanamaz
}

export async function checkHomepage(domain: string): Promise<HomepageResult> {
  const findings: Finding[] = [];
  const technologies = new Set<string>();
  const notes: string[] = [];

  const res = await get(`https://${domain}/`);
  if (!res) {
    notes.push("Siteye HTTPS üzerinden ulaşılamadı; dosya kontrolleri doğrulanamadı.");
    findings.push({
      id: "tls-unreachable",
      category: "tls",
      severity: "high",
      title: "HTTPS üzerinden erişilemedi",
      detail: "Site https ile yanıt vermedi ya da geçerli bir sertifikası yok.",
      recommendation: "Geçerli bir TLS sertifikası kurun ve HTTPS'i etkinleştirin.",
    });
    return { findings, technologies: [], notes, blocked: true };
  }

  findings.push({
    id: "tls-ok",
    category: "tls",
    severity: "pass",
    title: "HTTPS çalışıyor",
    detail: "Site geçerli bir sertifika ile HTTPS üzerinden yanıt verdi.",
  });

  // HTTP -> HTTPS yönlendirmesi
  try {
    const httpRes = await fetch(`http://${domain}/`, {
      redirect: "manual",
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(5000),
    });
    const loc = httpRes.headers.get("location") ?? "";
    if (httpRes.status >= 300 && httpRes.status < 400 && loc.startsWith("https://")) {
      findings.push({
        id: "http-redirect",
        category: "tls",
        severity: "pass",
        title: "HTTP, HTTPS'e yönlendiriliyor",
        detail: "Şifresiz istekler güvenli bağlantıya yönlendiriliyor.",
      });
    } else {
      findings.push({
        id: "http-no-redirect",
        category: "tls",
        severity: "medium",
        title: "HTTP, HTTPS'e yönlendirilmiyor",
        detail: "http:// adresi güvenli bağlantıya yönlendirmiyor.",
        recommendation: "Tüm http isteklerini 301 ile https'e yönlendirin.",
      });
    }
  } catch {
    // http kapalıysa sorun değil
  }

  // Site botları engelliyorsa başlık sonuçları yanıltıcı olur: yanlış bulgu üretme
  const blockedByWaf = [401, 403, 429, 503].includes(res.status) || res.headers.has("cf-mitigated");
  if (blockedByWaf) {
    notes.push(
      `Site otomatik isteği engellemiş olabilir (HTTP ${res.status}). Başlık ve dosya sonuçları eksik ya da yanıltıcı olabilir, elle doğrulayın.`
    );
    findings.push({
      id: "scan-blocked",
      category: "tls",
      severity: "info",
      title: "Site taramayı engellemiş olabilir",
      detail: `Ana sayfa HTTP ${res.status} döndürdü; başlık kontrolleri atlandı.`,
      recommendation: "Sonuçları tarayıcı geliştirici araçlarından elle doğrulayın.",
    });
    if (res.headers.get("cf-ray")) technologies.add("Cloudflare (CDN)");
    return { findings, technologies: [...technologies], notes, blocked: true };
  }
  if (res.status >= 400) {
    notes.push(`Ana sayfa HTTP ${res.status} döndürdü; sonuçlar bu yanıta göre hesaplandı.`);
  }

  const h = res.headers;

  // Güvenlik başlıkları
  const headerChecks: Array<{
    id: string;
    name: string;
    sev: Finding["severity"];
    why: string;
    fix: string;
    test?: (v: string) => boolean;
  }> = [
    {
      id: "hsts",
      name: "strict-transport-security",
      sev: "medium",
      why: "Tarayıcıya yalnızca HTTPS kullanmasını söyler; SSL stripping saldırılarını zorlaştırır.",
      fix: "Strict-Transport-Security: max-age=31536000; includeSubDomains",
    },
    {
      id: "csp",
      name: "content-security-policy",
      sev: "medium",
      why: "XSS ve veri enjeksiyonu saldırılarının etkisini sınırlar.",
      fix: "Content-Security-Policy: default-src 'self'; ... (siteye göre ayarlayın)",
    },
    {
      id: "xfo",
      name: "x-frame-options",
      sev: "low",
      why: "Clickjacking saldırılarını önler (alternatif: CSP frame-ancestors).",
      fix: "X-Frame-Options: DENY (ya da CSP içinde frame-ancestors 'none')",
    },
    {
      id: "xcto",
      name: "x-content-type-options",
      sev: "low",
      why: "Tarayıcının içerik türünü tahmin etmesini (MIME sniffing) engeller.",
      fix: "X-Content-Type-Options: nosniff",
      test: (v) => v.toLowerCase().includes("nosniff"),
    },
    {
      id: "referrer",
      name: "referrer-policy",
      sev: "low",
      why: "Başka sitelere sızan referrer bilgisini kontrol eder.",
      fix: "Referrer-Policy: strict-origin-when-cross-origin",
    },
    {
      id: "permissions",
      name: "permissions-policy",
      sev: "low",
      why: "Kamera, mikrofon, konum gibi tarayıcı özelliklerine erişimi kısıtlar.",
      fix: "Permissions-Policy: camera=(), microphone=(), geolocation=()",
    },
  ];

  for (const c of headerChecks) {
    let value = h.get(c.name);
    // X-Frame-Options yerine CSP frame-ancestors da yeterli
    if (c.id === "xfo" && !value) {
      const csp = h.get("content-security-policy") ?? "";
      if (csp.includes("frame-ancestors")) value = "csp:frame-ancestors";
    }
    if (value && (!c.test || c.test(value))) {
      findings.push({
        id: `hdr-${c.id}`,
        category: "headers",
        severity: "pass",
        title: `${c.name} mevcut`,
        detail: value.length > 120 ? value.slice(0, 120) + "…" : value,
      });
    } else {
      findings.push({
        id: `hdr-${c.id}-missing`,
        category: "headers",
        severity: c.sev,
        title: `${c.name} başlığı eksik`,
        detail: c.why,
        recommendation: c.fix,
      });
    }
  }

  // Bilgi sızdıran başlıklar
  const server = h.get("server");
  const powered = h.get("x-powered-by");
  if (powered) {
    findings.push({
      id: "leak-x-powered-by",
      category: "headers",
      severity: "low",
      title: "X-Powered-By başlığı teknoloji bilgisi veriyor",
      detail: `Değer: ${powered}`,
      recommendation: "Bu başlığı kaldırın; sürüm bilgisi saldırganlara yol gösterir.",
    });
    technologies.add(powered);
  }
  if (server) {
    const hasVersion = /\d+\.\d+/.test(server);
    findings.push({
      id: "leak-server",
      category: "headers",
      severity: hasVersion ? "low" : "info",
      title: hasVersion ? "Server başlığı sürüm bilgisi içeriyor" : "Server başlığı mevcut",
      detail: `Değer: ${server}`,
      recommendation: hasVersion ? "Sürüm numarasını gizleyin." : undefined,
    });
    technologies.add(`Server: ${server}`);
  }

  // Cookie bayrakları
  const cookies: string[] =
    typeof (h as unknown as { getSetCookie?: () => string[] }).getSetCookie === "function"
      ? (h as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : [];
  for (const raw of cookies) {
    const name = raw.split("=")[0];
    const lower = raw.toLowerCase();
    const missing: string[] = [];
    if (!lower.includes("secure")) missing.push("Secure");
    if (!lower.includes("httponly")) missing.push("HttpOnly");
    if (!lower.includes("samesite")) missing.push("SameSite");
    if (missing.length) {
      findings.push({
        id: `cookie-${name}`,
        category: "cookies",
        severity: "low",
        title: `Cookie "${name}" bayrakları eksik`,
        detail: `Eksik: ${missing.join(", ")}`,
        recommendation: "Oturum cookie'lerinde Secure; HttpOnly; SameSite=Lax (veya Strict) kullanın.",
      });
    }
  }

  // Teknoloji tespiti
  const cfRay = h.get("cf-ray");
  if (cfRay || /cloudflare/i.test(server ?? "")) technologies.add("Cloudflare (CDN)");
  if (h.get("x-vercel-id")) technologies.add("Vercel");
  if (h.get("x-nf-request-id")) technologies.add("Netlify");
  if (h.get("x-served-by")?.includes("cache")) technologies.add("Fastly (CDN)");
  if (h.get("x-github-request-id")) technologies.add("GitHub Pages");
  const cacheStatus = h.get("cf-cache-status") ?? h.get("x-cache");
  if (cacheStatus) technologies.add(`Önbellek: ${cacheStatus}`);

  const ct = h.get("content-type") ?? "";
  if (ct.includes("text/html")) {
    const { text: html } = await readCapped(res, 250_000);
    const gen = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i);
    if (gen) technologies.add(`Generator: ${gen[1]}`);
    if (/wp-content|wp-includes/i.test(html)) technologies.add("WordPress");
    if (/id=["']root["']|react/i.test(html) && /\/assets\/.*\.js|react/i.test(html)) technologies.add("React (olası)");
    if (/__NEXT_DATA__|\/_next\//.test(html)) technologies.add("Next.js");
    if (/data-v-[a-f0-9]{6,}|__vue__/i.test(html)) technologies.add("Vue.js (olası)");
    if (/cdn\.tailwindcss\.com|tailwind/i.test(html)) technologies.add("Tailwind CSS (olası)");
    if (/jquery/i.test(html)) technologies.add("jQuery");
    if (/googletagmanager|google-analytics/i.test(html)) technologies.add("Google Analytics/Tag Manager");
  }

  if (technologies.size) {
    findings.push({
      id: "tech-detected",
      category: "tech",
      severity: "info",
      title: `${technologies.size} teknoloji tespit edildi`,
      detail: [...technologies].join(", "),
      recommendation: "Kullandığınız yazılımları güncel tutun.",
    });
  }

  return { findings, technologies: [...technologies], notes, blocked: false };
}

// ---------- security.txt / robots.txt ----------

export async function checkWellKnownFiles(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  const isReal = async (url: string, mustInclude?: RegExp): Promise<boolean> => {
    const r = await get(url, 4000);
    if (!r || r.status !== 200) return false;
    const ct = r.headers.get("content-type") ?? "";
    // SPA'lar 404 yerine index.html döndürebilir; bunu "var" saymayalım
    if (ct.includes("text/html")) return false;
    if (mustInclude) {
      const t = (await readCapped(r, 8000)).text;
      return mustInclude.test(t);
    }
    return true;
  };

  const [sec, secLegacy, robots] = await Promise.all([
    isReal(`https://${domain}/.well-known/security.txt`, /contact\s*:/i),
    isReal(`https://${domain}/security.txt`, /contact\s*:/i),
    isReal(`https://${domain}/robots.txt`, /user-agent|sitemap|disallow/i),
  ]);

  findings.push(
    sec || secLegacy
      ? {
          id: "securitytxt-ok",
          category: "files",
          severity: "pass",
          title: "security.txt mevcut",
          detail: "Güvenlik araştırmacıları için iletişim bilgisi yayımlanmış.",
        }
      : {
          id: "securitytxt-missing",
          category: "files",
          severity: "low",
          title: "security.txt eksik",
          detail: "Güvenlik açığı bulan biri size nasıl ulaşacağını bilemez.",
          recommendation: "/.well-known/security.txt dosyası ekleyin (Contact ve Expires alanları zorunlu).",
        }
  );

  findings.push(
    robots
      ? {
          id: "robots-ok",
          category: "files",
          severity: "pass",
          title: "robots.txt mevcut",
          detail: "Arama motorları için yönergeler tanımlı.",
        }
      : {
          id: "robots-missing",
          category: "files",
          severity: "info",
          title: "robots.txt yok",
          detail: "Güvenlik açığı değildir; yalnızca SEO ile ilgilidir. Gizli yolları robots.txt'e yazmayın.",
        }
  );

  return findings;
}

// ---------- DNS: SPF / DMARC / CAA ----------

export async function checkDns(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const [txt, dmarc, caa, mx] = await Promise.all([
    doh(domain, "TXT"),
    doh(`_dmarc.${domain}`, "TXT"),
    doh(domain, "CAA"),
    doh(domain, "MX"),
  ]);

  const hasMail = mx.length > 0;
  const spf = txt.find((r) => /v=spf1/i.test(r.data));
  const dmarcRec = dmarc.find((r) => /v=DMARC1/i.test(r.data));

  if (spf) {
    const strict = /-all|~all/.test(spf.data);
    findings.push({
      id: "spf",
      category: "dns",
      severity: strict ? "pass" : "low",
      title: strict ? "SPF kaydı mevcut" : "SPF kaydı zayıf (+all veya ?all)",
      detail: spf.data.replace(/^"|"$/g, ""),
      recommendation: strict ? undefined : "SPF kaydının sonunu -all veya ~all yapın.",
    });
  } else {
    findings.push({
      id: "spf-missing",
      category: "dns",
      severity: hasMail ? "medium" : "low",
      title: "SPF kaydı yok",
      detail: "Alan adınız adına sahte e-posta gönderilmesini zorlaştırmak için SPF gerekir.",
      recommendation: hasMail
        ? "Mail sağlayıcınıza uygun bir SPF TXT kaydı ekleyin."
        : "E-posta kullanmıyorsanız 'v=spf1 -all' kaydı eklemek sahtekârlığı engeller.",
    });
  }

  if (dmarcRec) {
    const policy = dmarcRec.data.match(/p=(\w+)/i)?.[1]?.toLowerCase();
    findings.push({
      id: "dmarc",
      category: "dns",
      severity: policy === "none" ? "low" : "pass",
      title: policy === "none" ? "DMARC politikası p=none (yalnızca izleme)" : "DMARC kaydı mevcut",
      detail: dmarcRec.data.replace(/^"|"$/g, ""),
      recommendation: policy === "none" ? "İzleme sonrası p=quarantine veya p=reject'e geçin." : undefined,
    });
  } else {
    findings.push({
      id: "dmarc-missing",
      category: "dns",
      severity: hasMail ? "medium" : "low",
      title: "DMARC kaydı yok",
      detail: "DMARC olmadan sahte e-postalar alıcılarda daha kolay kabul edilir.",
      recommendation: "_dmarc.alanadi TXT kaydı ekleyin: v=DMARC1; p=quarantine; rua=mailto:...",
    });
  }

  findings.push(
    caa.length
      ? {
          id: "caa",
          category: "dns",
          severity: "pass",
          title: "CAA kaydı mevcut",
          detail: "Sertifika verebilecek kurumlar sınırlandırılmış.",
        }
      : {
          id: "caa-missing",
          category: "dns",
          severity: "info",
          title: "CAA kaydı yok",
          detail: "Hangi sertifika otoritelerinin sertifika verebileceğini kısıtlamak iyi bir pratiktir.",
          recommendation: '0 issue "letsencrypt.org" gibi bir CAA kaydı ekleyin.',
        }
  );

  return findings;
}

// ---------- Alt alan adları: crt.sh (sertifika şeffaflık kayıtları, pasif) ----------

export async function findSubdomains(
  domain: string
): Promise<{ subdomains: string[]; findings: Finding[]; notes: string[] }> {
  const notes: string[] = [];
  const res = await get(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`, 8000);

  // crt.sh yanıt vermezse "alt alan adı yok" demek yanıltıcı olur
  if (!res || !res.ok) {
    notes.push("Sertifika kayıtlarına (crt.sh) ulaşılamadı; alt alan adı listesi eksik olabilir.");
    return {
      subdomains: [],
      notes,
      findings: [
        {
          id: "subdomains-unknown",
          category: "subdomains",
          severity: "info",
          title: "Alt alan adları kontrol edilemedi",
          detail: "crt.sh şu anda yanıt vermedi. Daha sonra tekrar deneyin.",
        },
      ],
    };
  }

  // Büyük alan adlarında devasa JSON'u tamamen ayrıştırmak yerine sınırlı okuyup regex ile çekiyoruz
  const { text, truncated } = await readCapped(res, 600_000);
  const found = new Set<string>();
  for (const m of text.matchAll(/"name_value":"([^"]+)"/g)) {
    for (const n of m[1].split("\\n")) {
      const name = n.trim().toLowerCase().replace(/^\*\./, "");
      if (name.endsWith(`.${domain}`) && name !== domain && /^[a-z0-9.-]+$/.test(name)) found.add(name);
    }
  }
  if (truncated) {
    notes.push("Alt alan adı kaydı çok büyük olduğu için liste kısaltıldı; bazı alt alan adları görünmeyebilir.");
  }

  const subdomains = [...found].sort().slice(0, 100);
  const findings: Finding[] = [
    subdomains.length
      ? {
          id: "subdomains",
          category: "subdomains",
          severity: "info",
          title: `${subdomains.length} alt alan adı bulundu`,
          detail: subdomains.slice(0, 15).join(", ") + (subdomains.length > 15 ? " …" : ""),
          recommendation: "Kullanılmayan alt alan adlarını kaldırın (subdomain takeover riski).",
        }
      : {
          id: "subdomains-none",
          category: "subdomains",
          severity: "pass",
          title: "Sertifika kayıtlarında alt alan adı bulunamadı",
          detail: "crt.sh üzerinde bu alan adı için ek alt alan adı görünmüyor.",
        },
  ];
  return { subdomains, findings, notes };
}
