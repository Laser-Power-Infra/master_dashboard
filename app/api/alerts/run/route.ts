import { runAlerts } from "@/lib/alerts";

async function handle(request: Request) {
  const summary = new URL(request.url).searchParams.get("summary") === "1";
  return Response.json(await runAlerts({ summary }));
}

export const GET = handle;
export const POST = handle;
