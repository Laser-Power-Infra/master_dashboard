import { prisma } from "@/lib/prisma";
import { probeService } from "@/lib/probe";

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

  return Response.json(await probeService(service));
}
