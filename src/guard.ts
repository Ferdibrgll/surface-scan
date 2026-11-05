// SSRF koruması: yalnızca genel (public) alan adlarına izin verilir.

const HOSTNAME_RE =
  /^(?=.{1,253}$)(?!-)([a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,63}$/;

const BLOCKED_SUFFIXES = [".local", ".internal", ".localhost", ".lan", ".home", ".corp", ".intranet"];

export function normalizeDomain(input: string): string | null {
  let value = input.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.split("/")[0].split("?")[0].split("#")[0];
  value = value.replace(/:\d+$/, "");
  value = value.replace(/\.$/, "");

  // Yalnızca ASCII ya da punycode kabul edilir
  if (!HOSTNAME_RE.test(value)) return null;
  if (BLOCKED_SUFFIXES.some((s) => value.endsWith(s))) return null;
  if (value === "localhost") return null;
  // Sayısal TLD (ör. 127.0.0.1) HOSTNAME_RE tarafından zaten reddedilir
  return value;
}

export function isPrivateIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

export function isPrivateIPv6(ip: string): boolean {
  const v = ip.toLowerCase();
  return (
    v === "::1" ||
    v === "::" ||
    v.startsWith("fc") ||
    v.startsWith("fd") ||
    v.startsWith("fe8") ||
    v.startsWith("fe9") ||
    v.startsWith("fea") ||
    v.startsWith("feb") ||
    v.startsWith("::ffff:")
  );
}

export async function resolvesToPublicIp(domain: string): Promise<boolean> {
  const [a, aaaa] = await Promise.all([doh(domain, "A"), doh(domain, "AAAA")]);
  const ips4 = a.map((r) => r.data);
  const ips6 = aaaa.map((r) => r.data);
  if (ips4.length + ips6.length === 0) return false;
  if (ips4.some(isPrivateIPv4)) return false;
  if (ips6.some(isPrivateIPv6)) return false;
  return true;
}

export interface DohRecord {
  name: string;
  type: number;
  data: string;
}

const TYPE_NUM: Record<string, number> = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, AAAA: 28, CAA: 257 };

export async function doh(name: string, type: keyof typeof TYPE_NUM): Promise<DohRecord[]> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
      { headers: { accept: "application/dns-json" }, signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { Answer?: DohRecord[] };
    return (json.Answer ?? []).filter((r) => r.type === TYPE_NUM[type]);
  } catch {
    return [];
  }
}
