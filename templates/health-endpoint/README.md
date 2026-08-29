# Health Endpoint Templates

The dashboard monitors each registered service by fetching:

```
GET http://<ip>:<port>/api/health
```

every 30 seconds from the browser. Paste one of these into every project
you want to monitor. Pick the file that matches your framework.

| Framework | File | Drop-in location |
| --- | --- | --- |
| Next.js (App Router) | `nextjs-app-router-route.ts` | `app/api/health/route.ts` |
| Next.js (Pages Router) | `nextjs-pages-router-route.js` | `pages/api/health.ts` |
| Express (Node) | `express.js` | any router / `server.js` |
| FastAPI (Python) | `fastapi.py` | `main.py` |
| Flask (Python) | `flask.py` | `app.py` |

## Response contract

All variants return the same JSON shape:

```json
{
  "status": "ok",
  "uptime": 123.45,
  "timestamp": "2026-08-25T10:00:00Z"
}
```

## Why this endpoint

- It is lightweight (no DB queries, no heavy work).
- The dashboard only needs the endpoint to **respond** to mark the service
  online. It currently uses `mode: "no-cors"` pings, so the JSON body is not
  read — only reachability matters.
- The `Cache-Control: no-store` header prevents cached responses, and
  `Access-Control-Allow-Origin: *` lets the dashboard read the body later if
  you switch to a real CORS check.

## Notes

- Do not point the dashboard at `/` or `/healthz` unless your app actually
  serves a fast response there. `/api/health` is the agreed contract.
- If a service cannot respond quickly (e.g. heavy startup), the dashboard
  times out after 2.5s and marks it `OFFLINE`.