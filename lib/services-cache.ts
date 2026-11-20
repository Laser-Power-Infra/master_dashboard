import { prisma } from "@/lib/prisma";

const load = () => prisma.service.findMany({ orderBy: { createdAt: "asc" }, include: { tags: true } });

// The probe/alert polls need the service list every few seconds; querying each time keeps Neon awake.
// They reuse the copy from the last page load (GET /api/services always re-reads the DB) or edit.
// shortcut: rows changed outside this app reach the 5-minute alert run only after the next page load; add a TTL if that matters.
// globalThis so every route module shares it (same reason as lib/alerts.ts).
const g = globalThis as unknown as { servicesCache?: ReturnType<typeof load> };

export function getServices() {
  if (!g.servicesCache) {
    const p = load();
    g.servicesCache = p;
    // a failed load must not stay cached; only clear our own entry
    p.catch(() => {
      if (g.servicesCache === p) g.servicesCache = undefined;
    });
  }
  return g.servicesCache;
}

export function invalidateServices() {
  g.servicesCache = undefined;
}
