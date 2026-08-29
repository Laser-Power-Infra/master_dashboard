// Express.js (Node)
// Create: src/routes/health.ts and register, or paste into server.js
// The dashboard pings GET http://<ip>:<port>/api/health every 30s.
app.get("/api/health", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});