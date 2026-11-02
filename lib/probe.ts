import { buildPingUrl, type ServiceItem } from "@/types/service";

const PROBE_TIMEOUT_MS = 2500;

export interface ProbeResult {
  status: "ONLINE" | "OFFLINE";
  latencyMs: number | null;
  httpStatus: number | null;
  url: string;
  error?: string;
  /** ISO time of the dashboard's last data sync, from its health JSON `lastSync`; null if absent/invalid. */
  lastSync?: string | null;
}

export function parseLastSync(body: unknown): string | null {
  const v = (body as { lastSync?: unknown } | null)?.lastSync;
  if (typeof v !== "string") return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

export async function probeService(
  service: Pick<ServiceItem, "baseUrl" | "protocol" | "ip" | "port" | "healthcheck">
): Promise<ProbeResult> {
  const pingUrl = buildPingUrl(service);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  const start = performance.now();

  try {
    const res = await fetch(pingUrl, {
      cache: "no-store",
      redirect: "manual", // sign-in redirects mean the app is up
      signal: controller.signal,
    });
    const latencyMs = Math.round(performance.now() - start);
    // body read stays under the same timeout; non-JSON or aborted bodies just mean no lastSync
    const lastSync = res.ok ? parseLastSync(await res.json().catch(() => null)) : null;
    clearTimeout(timeoutId);

    // 3xx and 401/403 = reachable (auth-protected apps)
    const up = res.ok || (res.status >= 300 && res.status < 400) || res.status === 401 || res.status === 403;
    return up
      ? { status: "ONLINE", latencyMs, httpStatus: res.status, url: pingUrl, lastSync }
      : { status: "OFFLINE", latencyMs: null, httpStatus: res.status, url: pingUrl };
  } catch (e) {
    clearTimeout(timeoutId);
    return {
      status: "OFFLINE",
      latencyMs: null,
      httpStatus: null,
      url: pingUrl,
      error: e instanceof Error ? e.message : "fetch failed",
    };
  }
}
