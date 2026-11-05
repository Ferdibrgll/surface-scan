import { normalizeDomain, resolvesToPublicIp } from "./guard";
import { checkDns, checkHomepage, checkWellKnownFiles, findSubdomains } from "./checks";
import type { Env, Finding, ScanResult, Severity } from "./types";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

// Her bulgunun skora etkisi
const PENALTY: Record<Severity, number> = { high: 25, medium: 10, low: 4, info: 0, pass: 0 };

function buildResult(
  domain: string,
  findings: Finding[],
  subdomains: string[],
  technologies: string[],
  notes: string[]
): ScanResult {
  const summary: Record<Severity, number> = { high: 0, medium: 0, low: 0, info: 0, pass: 0 };
  let score = 100;
  for (const f of findings) {
    summary[f.severity]++;
    score -= PENALTY[f.severity];
  }
  score = Math.max(0, Math.min(100, score));
  return {
    domain,
    scannedAt: new Date().toISOString(),
    score,
    summary,
    findings,
    subdomains,
    technologies,
    notes,
  };
}

// Cloudflare rate limit bağlantısı yoksa kullanılan yedek (yalnızca bu Worker örneği için geçerli)
const hits = new Map<string, number[]>();
function localLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return true;
}

async function handleScan(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const domain = normalizeDomain(url.searchParams.get("domain") ?? "");
  if (!domain) return json({ error: "Geçerli bir alan adı girin (ör. ornek.com)." }, 400);

  // Rate limit (IP başına): binding varsa onu, yoksa yerel yedeği kullan
  const ip = request.headers.get("cf-connecting-ip") ?? "anon";
  const allowed = env.RATE_LIMITER ? (await env.RATE_LIMITER.limit({ key: ip })).success : localLimit(ip);
  if (!allowed) return json({ error: "Çok fazla istek. Bir dakika sonra tekrar deneyin." }, 429);

  // SSRF: alan adı genel bir IP'ye çözülmeli
  if (!(await resolvesToPublicIp(domain))) {
    return json({ error: "Bu alan adı çözümlenemedi ya da genel bir adrese işaret etmiyor." }, 400);
  }

  const [home, files, dns, subs] = await Promise.all([
    checkHomepage(domain),
    checkWellKnownFiles(domain),
    checkDns(domain),
    findSubdomains(domain),
  ]);

  // Site taramayı engellediyse dosya sonuçları doğrulanamaz: "eksik" demek yerine bilgi seviyesine indir
  const fileFindings: Finding[] = home.blocked
    ? files.map((f) => ({
        ...f,
        severity: "info" as const,
        detail: `${f.detail} (Site taramayı engellediği için doğrulanamadı.)`,
        recommendation: undefined,
      }))
    : files;

  const findings = [...home.findings, ...fileFindings, ...dns, ...subs.findings];
  const notes = [...home.notes, ...subs.notes];
  return json(buildResult(domain, findings, subs.subdomains, home.technologies, notes));
}

// Statik sayfalara eklenen güvenlik başlıkları (kendi tarayıcımızdan temiz çıkmak için)
const SECURITY_HEADERS: Record<string, string> = {
  "content-security-policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "cross-origin-opener-policy": "same-origin",
};

function withSecurityHeaders(res: Response): Response {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
  return out;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/scan" && request.method === "GET") {
      try {
        return await handleScan(request, env);
      } catch {
        return json({ error: "Tarama sırasında beklenmeyen bir hata oluştu." }, 500);
      }
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, rateLimiter: env.RATE_LIMITER ? "cloudflare-binding" : "yerel-yedek" });
    }

    if (url.pathname.startsWith("/api/")) return json({ error: "Bulunamadı" }, 404);

    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
};
