import { prisma } from "@/lib/prisma";
import {
  toServiceView,
  CATEGORY_ENUM,
  PROTOCOL_ENUM,
} from "@/lib/service-mapper";
import { parsePublicUrl } from "@/types/service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Service not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  const hasPublicUrl =
    body.baseUrl !== undefined &&
    String(body.baseUrl ?? "").trim() !== "";

  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.ip !== undefined && !hasPublicUrl) {
    const rawIp = String(body.ip).trim();
    if (rawIp.toLowerCase() === "null" || rawIp === "") {
      return Response.json({ error: "ip cannot be 'null' or empty" }, { status: 400 });
    }
    data.ip = rawIp;
  }
  if (body.port !== undefined && !hasPublicUrl) data.port = Number(body.port);
  if (body.category !== undefined) {
    const category = CATEGORY_ENUM[String(body.category)];
    if (!category) {
      return Response.json({ error: "Invalid category" }, { status: 400 });
    }
    data.category = category;
  }
  if (body.protocol !== undefined) {
    const protocol = PROTOCOL_ENUM[String(body.protocol)] ?? "HTTP";
    data.protocol = protocol;
  }
  if (body.description !== undefined) {
    data.description = String(body.description).trim() || null;
  }
  if (body.healthcheck !== undefined) {
    const raw = String(body.healthcheck).trim().replace(/\/null/g, "") || "/api/health";
    data.healthcheck = raw;
  }
  if (body.baseUrl !== undefined) {
    const raw = String(body.baseUrl).trim();
    if (raw) {
      const derived = parsePublicUrl(raw);
      if (!derived) {
        return Response.json({ error: "Invalid public URL" }, { status: 400 });
      }
      data.baseUrl = derived.baseUrl;
      data.ip = derived.ip;
      data.port = derived.port;
      data.protocol = PROTOCOL_ENUM[derived.protocol] ?? "HTTPS";
    } else {
      // baseUrl cleared → require LAN fields from body
      if (!body.ip || !body.port) {
        return Response.json(
          { error: "ip and port are required when public URL is cleared" },
          { status: 400 }
        );
      }
      const rawIp = String(body.ip).trim();
      if (rawIp.toLowerCase() === "null" || rawIp === "") {
        return Response.json({ error: "ip cannot be 'null' or empty" }, { status: 400 });
      }
      data.baseUrl = null;
      data.ip = rawIp;
      data.port = Number(body.port);
    }
  }
  if (body.isLarge !== undefined) data.isLarge = Boolean(body.isLarge);
  if (body.enabled !== undefined) data.enabled = Boolean(body.enabled);

  if (body.tags !== undefined) {
    const tagNames = Array.isArray(body.tags)
      ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
      : [];
    data.tags = {
      set: [],
      connectOrCreate: tagNames.map((t: string) => ({
        where: { name: t },
        create: { name: t },
      })),
    };
  }

  const service = await prisma.service.update({
    where: { id },
    data,
    include: { tags: true },
  });

  return Response.json(toServiceView(service));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Service not found" }, { status: 404 });
  }

  await prisma.service.delete({ where: { id } });
  return Response.json({ ok: true });
}