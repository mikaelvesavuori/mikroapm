# MikroAPM

**The minimalist uptime monitor that's all yours.**

![MikroAPM product view](./mikroapm.png)

MikroAPM is an ultralight uptime monitoring service that checks configured sites, stores failures, sends webhook and optional email notifications, and serves a small public status dashboard.

## Related Mikro Tool

MikroAPM tells you whether a service is reachable and when it went down or recovered. Pair it with [MikroScope](https://mikrosuite.com/scope/docs) when you also want to inspect the structured logs behind an incident.

## Features

- **Batteries included** - health checks, storage, alerting, and dashboard together
- **Two adapters** - Cloudflare Workers + KV or Hono server + PikoDB
- **Automatic scheduling** for server and Worker deployments
- **Protected admin API** for site management, manual checks, and cleanup
- **Webhook notifications** for down and recovered events
- **Optional email alerts** through Brevo when failure thresholds are reached
- **Current status records** with last check, duration, status code, and message
- **Flexible checks** with method, headers, body, expected status, response matching, latency limits, retries, and timeouts
- **Pause and maintenance windows** for planned downtime
- **Unified configuration** with environment variables overriding config files
- **Cost-aware storage** with optional low-write summary mode for KV
- **Read-only public dashboard** for configured site status, failures, and daily summaries
- **OpenAPI document** at `/openapi.json`

## Quick Start

### Download the Server

```bash
mkdir -p mikroapm/api mikroapm/app
ROOT="$PWD/mikroapm"

curl -sSL -o "$ROOT/mikroapm_api.zip" https://releases.mikrosuite.com/mikroapm_api_latest.zip
curl -sSL -o "$ROOT/mikroapm_app.zip" https://releases.mikrosuite.com/mikroapm_app_latest.zip

unzip -q "$ROOT/mikroapm_api.zip" -d "$ROOT/api"
unzip -q "$ROOT/mikroapm_app.zip" -d "$ROOT/app"

API_DIR="$(find "$ROOT/api" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
APP_DIR="$(find "$ROOT/app" -mindepth 1 -maxdepth 1 -type d | head -n 1)"

cd "$API_DIR"
MIKROAPM_ADMIN_TOKEN="change-me" MIKROAPM_STATIC_ROOT="$APP_DIR" node server.js
```

Open `http://127.0.0.1:3000`. To use the admin UI or protected admin API, set `MIKROAPM_ADMIN_TOKEN` or `admin.token` in `mikroapm.config.json`, then restart the server.

### Server Runtime

Create `mikroapm.config.json`:

```json
{
  "sites": [
    { "url": "https://example.com", "timeout": 10000 }
  ]
}
```

Run the server:

```bash
MIKROAPM_ADMIN_TOKEN="change-me" \
node server.js
```

The server stores local data in `./data/mikroapm` by default.

### Cloudflare Workers

```bash
cp wrangler.example.toml wrangler.toml
# Edit wrangler.toml and set your KV namespace ID
npx wrangler deploy -c wrangler.toml
```

Add monitored sites through the API:

```bash
curl -X POST https://your-worker.workers.dev/api/sites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MIKROAPM_ADMIN_TOKEN" \
  -d '[{ "url": "https://example.com", "timeout": 10000 }]'
```

## Configuration

MikroAPM resolves runtime configuration in this order:

1. Environment variables
2. Config file
3. Defaults

Common settings:

- `CHECK_INTERVAL_MINUTES` - health check interval in minutes
- `ENABLE_SUMMARY_WRITES` - enable or disable daily summary writes
- `BREVO_API_KEY` - Brevo API key for email alerts
- `MIKROAPM_ADMIN_TOKEN` - admin password required for admin API writes and site config reads
- `MIKROAPM_PUBLIC_PASSWORD` - optional password for public status APIs and dashboard data
- `WEBHOOK_URL` - webhook endpoint for `site.down` and `site.recovered` events
- `WEBHOOK_SECRET` - optional bearer token sent to the webhook endpoint
- `ALERT_THRESHOLD` - consecutive failures before alerting
- `ALERT_FROM_EMAIL`, `ALERT_FROM_NAME`, `ALERT_TO_EMAIL` - email alert metadata
- `ENABLE_SCHEDULER` - enable server-side scheduler
- `MIKROAPM_PORT` or `PORT` - server port
- `MIKROAPM_CONFIG_PATH` or `CONFIG_PATH` - config file path
- `MIKROAPM_DB_PATH` or `DB_PATH` - PikoDB data directory
- `MIKROAPM_STATIC_ROOT` - static asset directory for deployed favicons and manifest files

For Cloudflare Workers, keep `CHECK_INTERVAL_MINUTES` aligned with the cron schedule in `wrangler.toml`.

Example server configuration:

```json
{
  "sites": [
    {
      "name": "Website",
      "url": "https://example.com",
      "timeout": 10000,
      "method": "GET",
      "expectedStatuses": [200, 204],
      "expectedText": "Example",
      "maxLatencyMs": 2000,
      "retries": 2,
      "retryDelayMs": 500,
      "alertEmail": "you@example.com",
      "maintenanceWindows": [
        {
          "start": "2026-05-01T00:00:00.000Z",
          "end": "2026-05-01T01:00:00.000Z",
          "reason": "Planned deploy"
        }
      ]
    }
  ],
  "checkIntervalMinutes": 5,
  "enableSummaryWrites": true,
  "admin": {
    "token": "change-me"
  },
  "public": {
    "password": "optional-public-dashboard-password"
  },
  "alerts": {
    "threshold": 3,
    "webhookUrl": "https://hooks.example.com/mikroapm",
    "webhookSecret": "shared-secret",
    "fromEmail": "alerts@example.com",
    "fromName": "MikroAPM",
    "toEmail": "admin@example.com"
  }
}
```

Set `ENABLE_SCHEDULER=false` to run the server without automatic checks and trigger checks manually with `POST /api/check`.

Set `paused: true` on a site to stop checks. Use `maintenanceWindows` to suppress checks and notifications during planned downtime. URLs targeting localhost or private networks are rejected unless the site sets `allowPrivateNetwork: true`. Site `name` is optional and defaults to the protocol-less URL.

## Release Downloads

Latest release downloads:

- `https://releases.mikrosuite.com/mikroapm_api_latest.zip` - Node service, status/admin UI, and optional Workers bundle
- `https://releases.mikrosuite.com/mikroapm_app_latest.zip` - static public assets for icons and manifest metadata

GitHub Releases provide versioned archives for pinned deployments.

## API

- `GET /` serves the dashboard UI
- `GET /admin` serves the admin UI shell; protected actions require the admin password
- `GET /openapi.json` serves the OpenAPI document
- `GET /:domain` serves the dashboard UI for a bookmarked configured domain path
- `GET /api/status` returns current status for all monitored sites; optionally protected by `MIKROAPM_PUBLIC_PASSWORD` or `public.password`
- `GET /api/status/:domain` returns current status for a configured domain
- `GET /api/uptime/:domain?days=30` returns uptime stats for a configured domain
- `GET /api/failures/:domain/:date` returns failure details for a configured domain and day
- `GET /api/sites` lists full site configuration and requires `Authorization: Bearer <MIKROAPM_ADMIN_TOKEN>`
- `POST /api/sites` replaces the monitored site list and requires admin auth
- `POST /api/check` runs checks on demand and requires admin auth
- `POST /api/cleanup` removes expired records and requires admin auth

## Technology

- **Server**: Hono on Node.js
- **Workers**: Cloudflare Workers adapter
- **Storage**: PikoDB or Cloudflare KV
- **Config**: MikroValid-validated JSON plus environment overrides
- **Notifications**: Webhook events plus optional Brevo email API
- **Dashboard**: Server-rendered HTML
- **Build**: Prebuilt release archives, with esbuild-based server and Workers bundles

## License

MIT. See the [LICENSE](LICENSE) file.
