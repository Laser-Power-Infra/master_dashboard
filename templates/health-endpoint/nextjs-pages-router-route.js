// Next.js Pages Router (pages/api/health.ts)
// The dashboard pings GET http://<ip>:<port>/api/health every 30s.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({
    status: "ok",
    // ISO time of your last successful data sync (null if unknown); the portal alerts when it is too old
    lastSync: null,
    dependencies: {}, // e.g. { db: "ok", gmail: "ok" }
  });
}
