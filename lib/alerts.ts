import { prisma } from "@/lib/prisma";
import { probeService } from "@/lib/probe";
import { WARNING_LATENCY_THRESHOLD_MS } from "@/types/service";

const DOWN_MINUTES = Number(process.env.ALERT_DOWN_MINUTES) || 10;
const DEFAULT_STALE_HOURS = 24;
const STALE_HOURS: Record<string, number> = (() => {
  try {
    return JSON.parse(process.env.ALERT_STALE_HOURS_JSON || "{}");
  } catch {
    console.error("[alerts] ALERT_STALE_HOURS_JSON is not valid JSON, using defaults");
    return {};
  }
})();
const staleHoursFor = (name: string) => Number(STALE_HOURS[name]) || DEFAULT_STALE_HOURS;
const SLOW_SAMPLES = 3;
// shortcut: only the newest 500 samples per service are read, so `since` of a longer outage is clamped; raise if needed
const HISTORY_LIMIT = 500;

export type AlertKind = "down" | "stale" | "slow";
export interface ActiveAlert {
  serviceId: string;
  kind: AlertKind;
  since: string;
}

interface Sample {
  status: "ONLINE" | "OFFLINE";
  latencyMs: number | null;
  checkedAt: Date;
}

/** Alerts for one service from its samples, newest first. */
export function alertsFor(serviceId: string, samples: Sample[], now: Date): ActiveAlert[] {
  const latest = samples[0];
  if (!latest) return [];
  const out: ActiveAlert[] = [];

  const firstOffline = lastOfLeadingRun(samples, (s) => s.status === "OFFLINE");
  if (firstOffline && latest.checkedAt.getTime() - firstOffline.checkedAt.getTime() >= DOWN_MINUTES * 60_000) {
    out.push({ serviceId, kind: "down", since: firstOffline.checkedAt.toISOString() });
  }

  const isSlow = (s: Sample) => s.status === "ONLINE" && (s.latencyMs ?? 0) >= WARNING_LATENCY_THRESHOLD_MS;
  if (samples.length >= SLOW_SAMPLES && samples.slice(0, SLOW_SAMPLES).every(isSlow)) {
    out.push({ serviceId, kind: "slow", since: lastOfLeadingRun(samples, isSlow)!.checkedAt.toISOString() });
  }
  return out;
}

/** Data staleness: the dashboard's own `lastSync` is older than its threshold. */
export function staleAlert(serviceId: string, lastSync: string | null | undefined, hours: number, now: Date): ActiveAlert[] {
  if (!lastSync) return [];
  return now.getTime() - Date.parse(lastSync) >= hours * 3_600_000 ? [{ serviceId, kind: "stale", since: lastSync }] : [];
}

// shortcut: latest lastSync per service lives in process memory (no schema change), so it is empty until the
// first /api/alerts/run after a restart, and that first run re-notifies already-stale services; add a
// lastSync column on HealthCheck (or a small table) if restarts or multiple instances make that noisy.
// globalThis so the run route and GET route share it even when bundled as separate route modules.
const g = globalThis as unknown as { alertLastSync?: Map<string, string | null> };
const lastSyncs = (g.alertLastSync ??= new Map());

function lastOfLeadingRun<T>(items: T[], pred: (t: T) => boolean): T | undefined {
  let last: T | undefined;
  for (const item of items) {
    if (!pred(item)) break;
    last = item;
  }
  return last;
}

async function loadHistory() {
  const services = await prisma.service.findMany({ where: { enabled: true } });
  const histories = await Promise.all(
    services.map((s) =>
      prisma.healthCheck.findMany({
        where: { serviceId: s.id },
        orderBy: { checkedAt: "desc" },
        take: HISTORY_LIMIT,
      })
    )
  );
  return services.map((service, i) => ({ service, samples: histories[i] }));
}

export async function getActiveAlerts(now = new Date()): Promise<ActiveAlert[]> {
  return computeAlerts(await loadHistory(), lastSyncs, now);
}

function computeAlerts(
  rows: Awaited<ReturnType<typeof loadHistory>>,
  syncs: Map<string, string | null>,
  now: Date,
  sampleFilter: (s: Sample) => boolean = () => true
): ActiveAlert[] {
  return rows.flatMap(({ service, samples }) => [
    ...alertsFor(service.id, samples.filter(sampleFilter), now),
    ...staleAlert(service.id, syncs.get(service.id), staleHoursFor(service.name), now),
  ]);
}

async function notify(payload: Record<string, unknown>) {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) {
    console.log("[alerts]", JSON.stringify(payload));
    return;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.error(`[alerts] webhook responded ${res.status}`);
  } catch (e) {
    console.error("[alerts] webhook failed", e);
  }
}

const key = (a: ActiveAlert) => `${a.serviceId}:${a.kind}`;

/** Probe every enabled service, store a sample each, and notify on alert state changes. */
export async function runAlerts({ summary = false } = {}) {
  const runStart = new Date();
  const enabled = await prisma.service.findMany({ where: { enabled: true } });
  const probes = await Promise.all(enabled.map((s) => probeService(s)));
  await prisma.healthCheck.createMany({
    data: enabled.map((s, i) => ({
      serviceId: s.id,
      status: probes[i].status,
      latencyMs: probes[i].latencyMs,
    })),
  });
  const prevSyncs = new Map(lastSyncs);
  // OFFLINE probes have no lastSync: keep the last known value so a stale alert survives an outage
  enabled.forEach((s, i) => {
    const sync = probes[i].lastSync;
    if (sync !== undefined) lastSyncs.set(s.id, sync);
  });

  const now = new Date();
  const rows = await loadHistory();
  const names = new Map(rows.map(({ service }) => [service.id, service.name]));
  // "Already notified" = the alert was active before this run's samples / lastSyncs existed.
  // shortcut: if other writers also persist samples between runs, a transition they cause is not notified; add a notifications table if that happens
  const before = computeAlerts(rows, prevSyncs, runStart, (s) => s.checkedAt < runStart);
  const current = computeAlerts(rows, lastSyncs, now);

  const beforeKeys = new Set(before.map(key));
  const currentKeys = new Set(current.map(key));
  const opened = current.filter((a) => !beforeKeys.has(key(a)));
  const recovered = before.filter((a) => !currentKeys.has(key(a)));
  const named = (a: ActiveAlert) => ({ ...a, serviceName: names.get(a.serviceId) });

  for (const a of opened) await notify({ type: "alert", ...named(a) });
  for (const a of recovered) await notify({ type: "recovery", ...named(a) });

  if (summary) {
    await notify({
      type: "summary",
      at: now.toISOString(),
      total: enabled.length,
      online: probes.filter((p) => p.status === "ONLINE").length,
      alerts: current.map(named),
    });
  }

  return { probed: enabled.length, active: current, opened, recovered };
}
