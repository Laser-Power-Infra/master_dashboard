import { prisma } from "@/lib/prisma";
import { toHealthView } from "@/lib/service-mapper";
import { CheckStatus } from "@/lib/generated/prisma/client";

const DEFAULT_LIMIT = 50;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    return Response.json({ error: "Service not found" }, { status: 404 });
  }

  const checks = await prisma.healthCheck.findMany({
    where: { serviceId: id },
    orderBy: { checkedAt: "asc" },
    take: DEFAULT_LIMIT,
  });

  return Response.json(checks.map(toHealthView));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    return Response.json({ error: "Service not found" }, { status: 404 });
  }

  const body = await request.json();
  const status =
    body.status === "OFFLINE" ? CheckStatus.OFFLINE : CheckStatus.ONLINE;
  const latencyMs =
    body.latencyMs !== undefined && body.latencyMs !== null
      ? Math.max(0, Number(body.latencyMs))
      : null;

  const check = await prisma.healthCheck.create({
    data: {
      serviceId: id,
      status,
      latencyMs,
    },
  });

  return Response.json(toHealthView(check), { status: 201 });
}