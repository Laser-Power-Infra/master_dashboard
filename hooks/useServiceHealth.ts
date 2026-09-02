import { useState, useEffect } from "react";
import { buildPingUrl, isPublicService, type ServiceItem } from "@/types/service";

export type HealthStatus = "online" | "offline" | "checking";

export interface HealthState {
  status: HealthStatus;
  latency: number | null;
}

interface UseServiceHealthOptions {
  intervalMs?: number;
  timeoutMs?: number;
  checkSignal?: number;
}

export function useServiceHealth(
  service: ServiceItem | null,
  {
    intervalMs = 30000,
    timeoutMs = 2500,
    checkSignal = 0,
  }: UseServiceHealthOptions = {}
): HealthState {
  const [status, setStatus] = useState<HealthStatus>("checking");
  const [latency, setLatency] = useState<number | null>(null);

  const url = service ? buildPingUrl(service) : "";
  const serviceId = service?.id ?? "";
  const publicService = service ? isPublicService(service) : false;

  useEffect(() => {
    if (!serviceId) return;

    let isMounted = true;

    console.log(`[HealthCheck] START ${service?.name ?? serviceId} -> ${publicService ? "PROBE" : url}`);

    const checkHealth = async () => {
      if (publicService) {
        // Public (Vercel/HTTPS): server-side probe — reads real status, no CORS issue.
        console.log(`[HealthCheck] probing /api/services/${serviceId}/probe`);
        try {
          const res = await fetch(`/api/services/${serviceId}/probe`, {
            cache: "no-store",
          });
          if (!res.ok) {
            if (isMounted) {
              setLatency(null);
              setStatus("offline");
            }
            return;
          }
          const data: { status: string; latencyMs: number | null } = await res.json();
          if (isMounted) {
            if (data.status === "ONLINE") {
              setLatency(data.latencyMs);
              setStatus("online");
            } else {
              setLatency(null);
              setStatus("offline");
            }
          }
        } catch {
          if (isMounted) {
            setLatency(null);
            setStatus("offline");
          }
        }
        return;
      }

      console.log(`[HealthCheck] fetching ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const start = performance.now();

      try {
        // Strict CORS check: only 2xx counts as online. Requires target GET /api/health to send Access-Control-Allow-Origin:*
        // Templates in templates/health-endpoint/* already do this.
        const res = await fetch(url, {
          mode: "cors",
          cache: "no-store",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          console.log(`[HealthCheck] ❌ OFFLINE ${url} HTTP ${res.status}`);
          if (isMounted) {
            setLatency(null);
            setStatus("offline");
          }
          // recordCheck("OFFLINE", null); // disabled — no DB writes
          return;
        }

        const ms = Math.round(performance.now() - start);
        console.log(`[HealthCheck] ✅ ONLINE ${url} ${ms}ms (HTTP ${res.status})`);
        if (isMounted) {
          setLatency(ms);
          setStatus("online");
        }
        // recordCheck("ONLINE", ms); // disabled — no DB writes
      } catch (e) {
        clearTimeout(timeoutId);
        const msg = (e as Error)?.message ?? "";
        const name = (e as Error)?.name ?? "";
        // AbortError = timeout, TypeError = CORS block or network down
        console.log(`[HealthCheck] ❌ OFFLINE ${url}`, name, msg);
        if (isMounted) {
          setLatency(null);
          setStatus("offline");
        }
        // recordCheck("OFFLINE", null); // disabled — no DB writes
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [url, serviceId, intervalMs, timeoutMs, publicService, checkSignal]);

  return { status, latency };
}