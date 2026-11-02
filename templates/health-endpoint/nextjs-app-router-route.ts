// Next.js App Router
// Create: app/api/health/route.ts
// Returns a lightweight JSON health payload. The dashboard pings this endpoint
// (GET http://<ip>:<port>/api/health) every 30s.
export async function GET() {
  return Response.json(
    {
      status: "ok",
      // ISO time of your last successful data sync (null if unknown); the portal alerts when it is too old
      lastSync: null,
      dependencies: {}, // e.g. { db: "ok", gmail: "ok" }
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
