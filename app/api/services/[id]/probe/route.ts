import { prisma } from "@/lib/prisma";
import { buildPingUrl } from "@/types/service";

const PROBE_TIMEOUT_MS = 2500;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const service = await prisma.service.findUnique({
    where: { id },
    include: { tags: true },
  });
  if (!service) {
    return Response.json({ error: "Service not found" }, { status: 404 });
  }

  const pingUrl = buildPingUrl({
    baseUrl: service.baseUrl,
    protocol: service.protocol,
    ip: service.ip,
    port: service.port,
    healthcheck: service.healthcheck,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  const start = performance.now();

  try {
    const res = await fetch(pingUrl, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - start);

    if (!res.ok) {
      return Response.json({
        status: "OFFLINE",
        latencyMs: null,
        httpStatus: res.status,
        url: pingUrl,
      });
    }

    return Response.json({
      status: "ONLINE",
      latencyMs,
      httpStatus: res.status,
      url: pingUrl,
    });
  } catch (e) {
    clearTimeout(timeoutId);
    return Response.json({
      status: "OFFLINE",
      latencyMs: null,
      httpStatus: null,
      url: pingUrl,
      error: e instanceof Error ? e.message : "fetch failed",
    });
  }
}