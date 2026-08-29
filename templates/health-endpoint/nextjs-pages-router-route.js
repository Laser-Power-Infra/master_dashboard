// Next.js Pages Router (pages/api/health.ts)
// The dashboard pings GET http://<ip>:<port>/api/health every 30s.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}