This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Down / slow alerts

`POST /api/alerts/run` (GET also works) probes every enabled service, stores a `HealthCheck` sample per service and notifies only when an alert opens or recovers. `GET /api/alerts` returns the active alerts (`down` / `stale` / `slow`) from stored history without probing.

Schedule it on the server with Windows Task Scheduler (every 5 min, plus a daily summary):

```bat
schtasks /Create /TN "MasterPortalAlerts" /SC MINUTE /MO 5 /TR "curl.exe -s -X POST http://localhost:7777/api/alerts/run"
schtasks /Create /TN "MasterPortalAlertsSummary" /SC DAILY /ST 09:00 /TR "curl.exe -s -X POST http://localhost:7777/api/alerts/run?summary=1"
```

Env vars:

| Var | Default | Meaning |
| --- | --- | --- |
| `ALERT_WEBHOOK_URL` | unset | Webhook that receives JSON `{type: "alert"\|"recovery"\|"summary", ...}`. Unset = logged to the server console. |
| `ALERT_DOWN_MINUTES` | `10` | Minutes of continuous OFFLINE samples before a `down` alert. |
| `ALERT_STALE_HOURS_JSON` | unset | Per-service data-staleness thresholds in hours, keyed by service name, e.g. `{"News Agent":24,"Email Dashboard":1}`. Unlisted services use 24. |

`stale` = the `lastSync` (ISO string) returned by the service's health JSON is older than its threshold, i.e. the dashboard is up but its data stopped refreshing (see `templates/health-endpoint/`). Services that do not return `lastSync` never go stale. The latest `lastSync` is kept in server memory, so `stale` appears only after the first run following a restart.

`slow` = the last 3 samples are at or above `WARNING_LATENCY_THRESHOLD_MS` (`types/service.ts`).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
