import { useState, useEffect, useCallback } from "react";
import type { ServiceItem, HealthSample } from "@/types/service";

export interface ServiceInput {
  name: string;
  ip: string;
  port: number;
  category: string;
  protocol: string;
  description?: string | null;
  healthcheck?: string | null;
  baseUrl?: string | null;
  tags: string[];
  isLarge: boolean;
}

export function useServices() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // History fetching disabled — no DB health logs. UI uses live 30s fetch only.
  // const loadHistory = useCallback(async (serviceId: string) => {
  //   try {
  //     const res = await fetch(`/api/services/${serviceId}/health`);
  //     if (!res.ok) return [];
  //     const data: HealthSample[] = await res.json();
  //     return data;
  //   } catch {
  //     return [];
  //   }
  // }, []);

  const loadServicesData = useCallback(async () => {
    const res = await fetch("/api/services");
    if (!res.ok) throw new Error("Failed to load services");
    const data: ServiceItem[] = await res.json();
    return data.map((s) => ({
      ...s,
      status: "checking" as const,
      latency: null as number | null,
      history: [] as HealthSample[],
    }));
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const withHistory = await loadServicesData();
        if (!ignore) {
          setServices(withHistory);
          setError(null);
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Failed to load services");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [loadServicesData]);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const withHistory = await loadServicesData();
      setServices(withHistory);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [loadServicesData]);

  // refreshAllHistory disabled — no DB health logs
  // const refreshAllHistory = useCallback(
  //   async (list: ServiceItem[]) => {
  //     const withHistory = await Promise.all(
  //       list.map(async (s) => ({
  //         ...s,
  //         history: await loadHistory(s.id),
  //       }))
  //     );
  //     setServices(withHistory);
  //   },
  //   [loadHistory]
  // );

  const createService = useCallback(async (input: ServiceInput) => {
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || "Failed to create service");
    }
    const created: ServiceItem = await res.json();
    setServices((prev) => [
      { ...created, status: "checking", latency: null, history: [] },
      ...prev,
    ]);
    return created;
  }, []);

  const updateService = useCallback(
    async (id: string, input: Partial<ServiceInput>) => {
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Failed to update service");
      }
      const updated: ServiceItem = await res.json();
      setServices((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, ...updated, status: "checking", latency: null }
            : s
        )
      );
      return updated;
    },
    []
  );

  const deleteService = useCallback(async (id: string) => {
    const res = await fetch(`/api/services/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete service");
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    services,
    setServices,
    loading,
    error,
    loadServices,
    // loadHistory, refreshAllHistory disabled — no DB health logs
    createService,
    updateService,
    deleteService,
  };
}