export type Severity = "high" | "medium" | "low" | "info" | "pass";

export interface Finding {
  id: string;
  category: "headers" | "cookies" | "tls" | "files" | "dns" | "subdomains" | "tech";
  severity: Severity;
  title: string;
  detail: string;
  recommendation?: string;
}

export interface ScanResult {
  domain: string;
  scannedAt: string;
  score: number; // 0-100, yüksek = iyi
  summary: Record<Severity, number>;
  findings: Finding[];
  subdomains: string[];
  technologies: string[];
  notes: string[];
}

export interface Env {
  ASSETS: Fetcher;
  RATE_LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
}
