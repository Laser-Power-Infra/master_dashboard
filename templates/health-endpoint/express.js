// Express.js (Node)
// Create: src/routes/health.ts and register, or paste into server.js
// The dashboard pings GET http://<ip>:<port>/api/health every 30s.
app.get("/api/health", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    status: "ok",
    // ISO time of your last successful data sync (null if unknown); the portal alerts when it is too old
    lastSync: null,
    dependencies: {}, // e.g. { db: "ok", gmail: "ok" }
  });
});
