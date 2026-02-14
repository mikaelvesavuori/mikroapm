import { readFileSync } from "node:fs";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import {
  AlertService,
  ConfigManager,
  DashboardService,
  HealthCheckService,
  PikoDBStorage,
} from "../../index.js";
import { getDashboardHTML } from "../dashboard-template.js";

// Track when this service session started
const SERVICE_SESSION_START = Date.now();

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
  const { configPath = "./mikroapm.config.json", dbPath = "./data/mikroapm", env = {}, storage: providedStorage } = options;

  const app = new Hono();

  const storage = providedStorage || new PikoDBStorage(dbPath);
  const raw = readFileSync(configPath, "utf-8");
  const configManager = ConfigManager.create(storage, env, JSON.parse(raw));
  const alertService = new AlertService(configManager);
  const healthCheckService = new HealthCheckService(storage, configManager, alertService, SERVICE_SESSION_START);
  const dashboardService = new DashboardService(storage);

  app.use(async (_c, next) => {
    await storage.init();
    await next();
  });

  app.get("/", (c) => {
    return c.html(getDashboardHTML());
  });

  app.get("/api/uptime/:domain", async (c) => {
    const domain = c.req.param("domain");
    const days = parseInt(c.req.query("days") || "30", 10);

    try {
      const data = await dashboardService.getUptimeData(domain, days);
      return c.json(data);
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  app.get("/api/failures/:domain/:date", async (c) => {
    const domain = c.req.param("domain");
    const date = c.req.param("date");

    try {
      const data = await dashboardService.getDayFailures(domain, date);
      return c.json(data);
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  app.get("/api/sites", async (c) => {
    try {
      const sites = await configManager.getSites();
      return c.json(sites);
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  app.post("/api/sites", async (c) => {
    try {
      const sites = await c.req.json();
      await configManager.setSites(sites);
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  app.post("/api/check", async (c) => {
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
    const raw = readFileSync(configPath, 'utf-8');
    const configManager = ConfigManager.create(storage, env, JSON.parse(raw));
    const alertService = new AlertService(configManager);
    const healthCheckService = new HealthCheckService(storage, configManager, alertService, SERVICE_SESSION_START);

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
        console.error('Health check failed:', error);
      }
    }, interval);
  }
}

export default { createHonoApp, startServer };
