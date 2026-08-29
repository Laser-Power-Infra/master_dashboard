// Next.js App Router
// Create: app/api/health/route.ts
// Returns a lightweight JSON health payload. The dashboard pings this endpoint
// (GET http://<ip>:<port>/api/health) every 30s.
export async function GET() {
  return Response.json(
    {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}