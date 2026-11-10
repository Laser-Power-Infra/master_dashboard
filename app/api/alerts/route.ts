import { getActiveAlerts } from "@/lib/alerts";

export const dynamic = "force-dynamic"; // computed from in-memory probe samples, never prerender

export async function GET() {
  return Response.json(await getActiveAlerts());
}
