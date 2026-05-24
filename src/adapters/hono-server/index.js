import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import {
  AlertService,
  ConfigManager,
  createAuthRateLimiter,
  DashboardService,
  getAdminAuthResult,
  getPublicAuthResult,
  getSiteDomain,
  HealthCheckService,
  PikoDBStorage,
  ValidationError,
} from "../../index.js";
import { getAdminHTML } from "../admin-template.js";
import { getDashboardHTML } from "../dashboard-template.js";
import { getOpenApiDocument } from "../openapi.js";

// Track when this service session started
const SERVICE_SESSION_START = Date.now();
const PUBLIC_ASSET_DIRS = [
  process.env.MIKROAPM_STATIC_ROOT,
  process.env.STATIC_ROOT,
  join(dirname(fileURLToPath(import.meta.url)), "public"),
  join(dirname(fileURLToPath(import.meta.url)), "../../public"),
].filter(Boolean);

const PUBLIC_ASSET_TYPES = {
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

/**
 * Create Hono app for MikroAPM server
 * @param {Object} options
 * @param {string} [options.configPath='./mikroapm.config.json'] - Path to config file
 * @param {string} [options.dbPath='./data/mikroapm'] - Path to PikoDB database directory
 * @param {Object} [options.env={}] - Environment variables (for secrets like BREVO_API_KEY)
 * @param {Object} [options.storage] - Optional storage instance to reuse (for sharing between app and scheduler)
 * @returns {Hono} Configured Hono app
 */
export function createHonoApp(options = {}) {
  const {
    configPath = "./mikroapm.config.json",
    dbPath = "./data/mikroapm",
    env = {},
    storage: providedStorage,
  } = options;

  const app = new Hono();
  const adminRateLimiter = createAuthRateLimiter();

  const storage = providedStorage || new PikoDBStorage(dbPath);
  const raw = readFileSync(configPath, "utf-8");
  const configManager = ConfigManager.create(storage, env, JSON.parse(raw));
  const alertService = new AlertService(configManager);
  const healthCheckService = new HealthCheckService(
    storage,
    configManager,
    alertService,
    SERVICE_SESSION_START,
  );
  const dashboardService = new DashboardService(storage);

  app.use(async (_c, next) => {
    await storage.init();
    await next();
  });

  app.get("/", (c) => {
    return c.html(getDashboardHTML());
  });

  app.get("/admin", (c) => {
    return c.html(getAdminHTML());
  });

  app.get("/openapi.json", (c) => {
    return c.json(getOpenApiDocument());
  });

  app.get("/manifest.webmanifest", (c) => servePublicAsset(c, "manifest.webmanifest"));
  app.get("/app-icon.svg", (c) => servePublicAsset(c, "app-icon.svg"));
  app.get("/favicon.svg", (c) => servePublicAsset(c, "favicon.svg"));
  app.get("/favicon.ico", (c) => servePublicAsset(c, "favicon.ico"));
  app.get("/favicon-16.png", (c) => servePublicAsset(c, "favicon-16.png"));
  app.get("/favicon-32.png", (c) => servePublicAsset(c, "favicon-32.png"));
  app.get("/app-icon-192.png", (c) => servePublicAsset(c, "app-icon-192.png"));
  app.get("/app-icon-512.png", (c) => servePublicAsset(c, "app-icon-512.png"));
  app.get("/apple-touch-icon.png", (c) => servePublicAsset(c, "apple-touch-icon.png"));

  app.get("/api/status", async (c) => {
    const auth = requirePublic(c, configManager, adminRateLimiter);
    if (auth) return auth;

    try {
      const sites = await configManager.getSites();
      return c.json(await dashboardService.getStatusData(sites));
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  app.get("/api/status/:domain", async (c) => {
    const auth = requirePublic(c, configManager, adminRateLimiter);
    if (auth) return auth;

    const domain = decodeURIComponent(c.req.param("domain"));

    try {
      const site = await getConfiguredSite(configManager, domain);
      if (!site) return siteNotConfigured(c, domain);
      return c.json(await dashboardService.getCurrentStatus(domain));
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  app.get("/api/uptime/:domain", async (c) => {
    const auth = requirePublic(c, configManager, adminRateLimiter);
    if (auth) return auth;

    const domain = decodeURIComponent(c.req.param("domain"));
    const days = parseInt(c.req.query("days") || "30", 10);

    try {
      const site = await getConfiguredSite(configManager, domain);
      if (!site) return siteNotConfigured(c, domain);
      const data = await dashboardService.getUptimeData(domain, days);
      return c.json(data);
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  app.get("/api/failures/:domain/:date", async (c) => {
    const auth = requirePublic(c, configManager, adminRateLimiter);
    if (auth) return auth;

    const domain = decodeURIComponent(c.req.param("domain"));
    const date = c.req.param("date");

    try {
      const site = await getConfiguredSite(configManager, domain);
      if (!site) return siteNotConfigured(c, domain);
      const data = await dashboardService.getDayFailures(domain, date);
      return c.json(data);
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  app.get("/api/sites", async (c) => {
    const auth = requireAdmin(c, configManager, adminRateLimiter);
    if (auth) return auth;

    try {
      const sites = await configManager.getSites();
      return c.json(sites);
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  app.post("/api/sites", async (c) => {
    const auth = requireAdmin(c, configManager, adminRateLimiter);
    if (auth) return auth;

    try {
      const sites = await c.req.json();
      await configManager.setSites(sites);
      return c.json({ success: true });
    } catch (error) {
      if (error instanceof ValidationError) {
        return c.json({ error: error.message, details: error.details }, 400);
      }
      return c.json({ error: error.message }, 500);
    }
  });

  app.post("/api/check", async (c) => {
    const auth = requireAdmin(c, configManager, adminRateLimiter);
    if (auth) return auth;

    try {
      const sites = await configManager.getSites();
      await healthCheckService.runChecks(sites);
      if (configManager.getEnableSummaryWrites()) {
        await healthCheckService.updateDailySummaries(sites);
      }
      return c.json({ success: true, checked: sites.length });
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  app.post("/api/cleanup", async (c) => {
    const auth = requireAdmin(c, configManager, adminRateLimiter);
    if (auth) return auth;

    try {
      await storage.cleanup();
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  // Catch-all route: serve dashboard for any non-API path
  // This allows URLs like /mikaelvesavuori.se to work for bookmarking
  app.get("*", (c) => {
    return c.html(getDashboardHTML());
  });

  return app;
}

/**
 * Start the Hono server
 * @param {Object} options
 * @param {number} [options.port=3000] - Server port
 * @param {string} [options.configPath='./mikroapm.config.json'] - Path to config file
 * @param {string} [options.dbPath='./data/mikroapm'] - Path to PikoDB database directory
 * @param {Object} [options.env={}] - Environment variables (for secrets like BREVO_API_KEY)
 * @param {boolean} [options.enableScheduler=true] - Enable built-in health check scheduler
 * @param {number} [options.checkIntervalMinutes] - Health check interval in minutes (defaults to CHECK_INTERVAL_MINUTES env or 1)
 */
export function startServer(options = {}) {
  const { port = 3000, enableScheduler = true, checkIntervalMinutes, ...rest } = options;

  // Create storage once and share it between app and scheduler
  const { configPath = "./mikroapm.config.json", dbPath = "./data/mikroapm", env = {} } = rest;
  const storage = new PikoDBStorage(dbPath);

  const app = createHonoApp({ ...rest, storage });

  serve({
    fetch: app.fetch,
    port,
  });

  console.log(`MikroAPM server running on http://localhost:${port}`);

  // Start built-in scheduler if enabled
  if (enableScheduler) {
    const raw = readFileSync(configPath, "utf-8");
    const configManager = ConfigManager.create(storage, env, JSON.parse(raw));
    const alertService = new AlertService(configManager);
    const healthCheckService = new HealthCheckService(
      storage,
      configManager,
      alertService,
      SERVICE_SESSION_START,
    );

    const interval = (checkIntervalMinutes || configManager.getCheckIntervalMinutes()) * 60 * 1000;

    console.log(`Health check scheduler enabled (every ${interval / 60000} minutes)`);

    // Run immediately on startup
    (async () => {
      await storage.init();
      const sites = await configManager.getSites();
      await healthCheckService.runChecks(sites);
      if (configManager.getEnableSummaryWrites()) {
        await healthCheckService.updateDailySummaries(sites);
      }
      console.log(`Initial health check completed for ${sites.length} site(s)`);
    })();

    // Then run on interval
    setInterval(async () => {
      try {
        await storage.init();
        const sites = await configManager.getSites();
        await healthCheckService.runChecks(sites);
        if (configManager.getEnableSummaryWrites()) {
          await healthCheckService.updateDailySummaries(sites);
        }
        console.log(`Health check completed for ${sites.length} site(s)`);
      } catch (error) {
        console.error("Health check failed:", error);
      }
    }, interval);
  }
}

export default { createHonoApp, startServer };

function requireAdmin(c, configManager, rateLimiter) {
  const result = getAdminAuthResult(c.req.raw, configManager.getAdminToken(), {
    rateLimiter,
  });
  if (result.ok) return null;
  const headers = result.retryAfter ? { "Retry-After": String(result.retryAfter) } : undefined;
  return c.json({ error: result.error }, result.status, headers);
}

function requirePublic(c, configManager, rateLimiter) {
  const result = getPublicAuthResult(c.req.raw, configManager.getPublicPassword(), {
    rateLimiter,
  });
  if (result.ok) return null;
  const headers = result.retryAfter ? { "Retry-After": String(result.retryAfter) } : undefined;
  return c.json({ error: result.error }, result.status, headers);
}

async function getConfiguredSite(configManager, domain) {
  const sites = await configManager.getSites();
  return sites.find((site) => getSiteDomain(site) === domain);
}

function siteNotConfigured(c, domain) {
  return c.json(
    {
      code: "SITE_NOT_CONFIGURED",
      error: `${domain} is not monitored by this MikroAPM instance.`,
    },
    404,
  );
}

function servePublicAsset(c, fileName) {
  const filePath = PUBLIC_ASSET_DIRS.map((assetDir) => join(assetDir, fileName)).find((path) =>
    existsSync(path),
  );

  if (!filePath) {
    return c.notFound();
  }

  const extension = fileName.slice(fileName.lastIndexOf("."));
  return c.body(readFileSync(filePath), 200, {
    "Cache-Control": "public, max-age=86400",
    "Content-Type": PUBLIC_ASSET_TYPES[extension] || "application/octet-stream",
  });
}
