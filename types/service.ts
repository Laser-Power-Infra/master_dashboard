export type ServiceStatus = "online" | "offline" | "checking";

export const WARNING_LATENCY_THRESHOLD_MS = 800;

export function deriveDisplayStatus(
  service: Pick<ServiceItem, "status" | "latency">
): "online" | "warning" | "offline" | "checking" {
  if (service.status === "checking") return "checking";
  if (service.status === "offline") return "offline";
  if (
    service.latency !== null &&
    service.latency !== undefined &&
    service.latency >= WARNING_LATENCY_THRESHOLD_MS
  ) {
    return "warning";
  }
  return "online";
}

export interface HealthSample {
  id: string;
  status: "ONLINE" | "OFFLINE";
  latencyMs: number | null;
  checkedAt: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  ip: string;
  port: number;
  protocol: string;
  healthcheck?: string | null;
  baseUrl?: string | null;
  tags: string[];
  isLarge: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  // Live fields, computed client-side (not persisted on the Service)
  status: ServiceStatus;
  latency?: number | null;
  history: HealthSample[];
}

export function buildBaseUrl(service: Pick<ServiceItem, "baseUrl" | "protocol" | "ip" | "port">): string {
  const rawBase = service.baseUrl?.trim();
  if (rawBase && rawBase.toLowerCase() !== "null") {
    return rawBase.replace(/\/null/g, "");
  }
  const ip = service.ip?.trim() ?? "";
  // Guard against literal "null" string stored in DB
  const cleanIp = ip.toLowerCase() === "null" || ip === "" ? "127.0.0.1" : ip;
  const scheme = service.protocol === "HTTPS" ? "https" : service.protocol === "TCP" ? "http" : "http";
  return `${scheme}://${cleanIp}:${service.port}`;
}

export const DEFAULT_HEALTHCHECK_PATH = "/api/health";

export function buildPingUrl(service: Pick<ServiceItem, "baseUrl" | "protocol" | "ip" | "port" | "healthcheck">): string {
  const base = buildBaseUrl(service);
  const rawPath = service.healthcheck?.trim() || DEFAULT_HEALTHCHECK_PATH;
  const path = rawPath.replace(/\/null/g, "") || DEFAULT_HEALTHCHECK_PATH;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}