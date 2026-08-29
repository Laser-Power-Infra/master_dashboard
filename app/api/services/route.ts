import { prisma } from "@/lib/prisma";
import {
  toServiceView,
  CATEGORY_ENUM,
  PROTOCOL_ENUM,
} from "@/lib/service-mapper";

export async function GET() {
  const services = await prisma.service.findMany({
    orderBy: { createdAt: "asc" },
    include: { tags: true },
  });
  return Response.json(services.map(toServiceView));
}

export async function POST(request: Request) {
  const body = await request.json();

  const name = String(body.name ?? "").trim();
  const rawIp = String(body.ip ?? "").trim();
  const ip = rawIp.toLowerCase() === "null" || rawIp === "" ? "" : rawIp;
  const port = Number(body.port);
  const category = CATEGORY_ENUM[String(body.category ?? "")];
  const protocol = PROTOCOL_ENUM[String(body.protocol ?? "HTTP")] ?? "HTTP";

  if (!name || !ip || ip.toLowerCase() === "null" || !Number.isInteger(port) || port <= 0 || !category) {
    return Response.json(
      { error: "name, ip (valid LAN IP/host, not 'null'), a valid port, and a valid category are required" },
      { status: 400 }
    );
  }
  // Sanitize healthcheck: strip stray "/null" segments that create .../null/api/health
  const rawHealth = body.healthcheck ? String(body.healthcheck).trim() : "/api/health";
  const healthcheck = rawHealth.replace(/\/null/g, "") || "/api/health";
  const rawBase = body.baseUrl ? String(body.baseUrl).trim() : null;
  const baseUrl = rawBase && rawBase.toLowerCase() !== "null" ? rawBase.replace(/\/null/g, "") : null;

  const tagNames = Array.isArray(body.tags)
    ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
    : [];

  const service = await prisma.service.create({
    data: {
      name,
      ip,
      port,
      category,
      protocol,
      description: body.description ? String(body.description).trim() : null,
      healthcheck,
      baseUrl,
      isLarge: Boolean(body.isLarge),
      tags: {
        connectOrCreate: tagNames.map((t: string) => ({
          where: { name: t },
          create: { name: t },
        })),
      },
    },
    include: { tags: true },
  });

  return Response.json(toServiceView(service), { status: 201 });
}