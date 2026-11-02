import { getActiveAlerts } from "@/lib/alerts";

export const dynamic = "force-dynamic"; // computed from live DB history, never prerender

export async function GET() {
  return Response.json(await getActiveAlerts());
}
