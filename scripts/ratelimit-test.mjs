// Kullanım: node scripts/ratelimit-test.mjs [adres] [alan-adı]
// Örnek:    node scripts/ratelimit-test.mjs http://127.0.0.1:8787 example.com
// Yalnızca kendi Worker adresinize karşı çalıştırın. example.com test için ayrılmış bir alan adıdır.

const base = (process.argv[2] || "http://127.0.0.1:8787").replace(/\/$/, "");
const domain = process.argv[3] || "example.com";

console.log(`Hedef: ${base}  ·  taranan alan adı: ${domain}\n`);

let limited = 0;
for (let i = 1; i <= 7; i++) {
  const res = await fetch(`${base}/api/scan?domain=${encodeURIComponent(domain)}`);
  if (res.status === 429) limited++;
  console.log(`İstek ${i}: HTTP ${res.status}`);
}

try {
  const health = await (await fetch(`${base}/api/health`)).json();
  console.log("\nSağlık:", health);
} catch {
  console.log("\nSağlık uç noktasına ulaşılamadı.");
}

console.log(
  limited > 0
    ? `\nRate limit çalışıyor (${limited} istek 429 ile reddedildi).`
    : "\nUYARI: 7 istekten hiçbiri sınırlanmadı. Cloudflare panelinden rate limiting kuralı ekleyin."
);
