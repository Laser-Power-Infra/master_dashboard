import { useEffect, useState } from "react";

export interface ServiceAlert {
  serviceId: string;
  kind: "down" | "stale" | "slow";
  since: string;
}

/** Polls GET /api/alerts every 60s; any failure (404, network, bad JSON) keeps the last known list. */
export function useAlerts(): Record<string, ServiceAlert[]> {
  const [alerts, setAlerts] = useState<Record<string, ServiceAlert[]>>({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/alerts", { cache: "no-store" });
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (cancelled || !Array.isArray(data)) return;
        const map: Record<string, ServiceAlert[]> = {};
        for (const a of data as ServiceAlert[]) if (a?.serviceId) (map[a.serviceId] ??= []).push(a);
        setAlerts(map);
      } catch {
        // endpoint may not exist yet; stay silent
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return alerts;
}
