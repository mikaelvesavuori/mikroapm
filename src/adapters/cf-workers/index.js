import { AlertService } from "../../core/AlertService.js";
import {
  adminJsonResponse,
  createAuthRateLimiter,
  getAdminAuthResult,
  getPublicAuthResult,
} from "../../core/Auth.js";
import { ConfigManager } from "../../core/ConfigManager.js";
import { DashboardService } from "../../core/DashboardService.js";
import { HealthCheckService } from "../../core/HealthCheckService.js";
import { getSiteDomain, ValidationError } from "../../core/SiteValidator.js";
import { KVStorage } from "../../storage/KVStorage.js";
import { getAdminHTML } from "../admin-template.js";
import { getDashboardHTML } from "../dashboard-template.js";
import { getOpenApiDocument } from "../openapi.js";

/**
 * Create Cloudflare Workers handler for MikroAPM
 * This module exports the handler for both scheduled (health checks) and fetch (dashboard) events
 */
const adminRateLimiter = createAuthRateLimiter();

/**
 * Handle scheduled events (health checks)
 * @param {ScheduledEvent} event
 * @param {Object} env - Cloudflare Workers environment bindings
 * @param {ExecutionContext} ctx
 */
export async function handleScheduled(_event, env, ctx) {
  const storage = new KVStorage(env.UPTIME_KV);
  const configManager = ConfigManager.create(storage, env);
  const alertService = new AlertService(configManager);
  const healthCheckService = new HealthCheckService(storage, configManager, alertService);

  const sites = await configManager.getSites();

  await healthCheckService.runChecks(sites);

  // Update daily summaries asynchronously (if enabled)
  if (configManager.getEnableSummaryWrites()) {
    ctx.waitUntil(healthCheckService.updateDailySummaries(sites));
  }
}

/**
 * Handle fetch events (dashboard API)
 * @param {Request} request
 * @param {Object} env - Cloudflare Workers environment bindings
 * @returns {Response}
 */
export async function handleFetch(request, env) {
  const storage = new KVStorage(env.UPTIME_KV);
  const configManager = ConfigManager.create(storage, env);
  const dashboardService = new DashboardService(storage);

  const url = new URL(request.url);

  if (url.pathname === "/admin") {
    return new Response(getAdminHTML(), {
      headers: { "Content-Type": "text/html" },
    });
  }

  if (url.pathname === "/openapi.json") {
    return json(getOpenApiDocument());
  }

  if (url.pathname === "/api/status") {
    const auth = getPublicAuthResult(request, configManager.getPublicPassword(), {
      rateLimiter: adminRateLimiter,
    });
    if (!auth.ok) return adminJsonResponse(auth);

    try {
      const sites = await configManager.getSites();
      return json(await dashboardService.getStatusData(sites));
    } catch (error) {
      return json({ error: error.message }, 500);
    }
  }

  if (url.pathname.startsWith("/api/status/")) {
    const auth = getPublicAuthResult(request, configManager.getPublicPassword(), {
      rateLimiter: adminRateLimiter,
    });
    if (!auth.ok) return adminJsonResponse(auth);

    const domain = decodeURIComponent(url.pathname.split("/api/status/")[1]);

    try {
      const site = await getConfiguredSite(configManager, domain);
      if (!site) return siteNotConfigured(domain);
      return json(await dashboardService.getCurrentStatus(domain));
    } catch (error) {
      return json({ error: error.message }, 500);
    }
  }

  // API endpoint for uptime data
  if (url.pathname.startsWith("/api/uptime/")) {
    const auth = getPublicAuthResult(request, configManager.getPublicPassword(), {
      rateLimiter: adminRateLimiter,
    });
    if (!auth.ok) return adminJsonResponse(auth);

    const domain = decodeURIComponent(url.pathname.split("/api/uptime/")[1]);
    const days = parseInt(url.searchParams.get("days") || "30", 10);

    try {
      const site = await getConfiguredSite(configManager, domain);
      if (!site) return siteNotConfigured(domain);
      const data = await dashboardService.getUptimeData(domain, days);
      return json(data);
    } catch (error) {
      return json({ error: error.message }, 500);
    }
  }

  // API endpoint for day-specific failures
  if (url.pathname.startsWith("/api/failures/")) {
    const auth = getPublicAuthResult(request, configManager.getPublicPassword(), {
      rateLimiter: adminRateLimiter,
    });
    if (!auth.ok) return adminJsonResponse(auth);

    const pathParts = url.pathname.split("/");
    const domain = decodeURIComponent(pathParts[3]);
    const date = pathParts[4];

    try {
      const site = await getConfiguredSite(configManager, domain);
      if (!site) return siteNotConfigured(domain);
      const data = await dashboardService.getDayFailures(domain, date);
      return json(data);
    } catch (error) {
      return json({ error: error.message }, 500);
    }
  }

  // API endpoint for sites configuration
  if (url.pathname === "/api/sites") {
    const auth = getAdminAuthResult(request, configManager.getAdminToken(), {
      rateLimiter: adminRateLimiter,
    });
    if (!auth.ok) return adminJsonResponse(auth);

    if (request.method === "GET") {
      try {
        const sites = await configManager.getSites();
        return json(sites);
      } catch (error) {
        return json({ error: error.message }, 500);
      }
    }

    if (request.method === "POST") {
      try {
        const sites = await request.json();
        await configManager.setSites(sites);
        return json({ success: true });
      } catch (error) {
        if (error instanceof ValidationError) {
          return json({ error: error.message, details: error.details }, 400);
        }
        return json({ error: error.message }, 500);
      }
    }
  }

  if (url.pathname === "/api/check" && request.method === "POST") {
    const auth = getAdminAuthResult(request, configManager.getAdminToken(), {
      rateLimiter: adminRateLimiter,
    });
    if (!auth.ok) return adminJsonResponse(auth);

    try {
      const alertService = new AlertService(configManager);
      const healthCheckService = new HealthCheckService(storage, configManager, alertService);
      const sites = await configManager.getSites();
      await healthCheckService.runChecks(sites);
      if (configManager.getEnableSummaryWrites()) {
        await healthCheckService.updateDailySummaries(sites);
      }
      return json({ success: true, checked: sites.length });
    } catch (error) {
      return json({ error: error.message }, 500);
    }
  }

  if (url.pathname === "/api/cleanup" && request.method === "POST") {
    const auth = getAdminAuthResult(request, configManager.getAdminToken(), {
      rateLimiter: adminRateLimiter,
    });
    if (!auth.ok) return adminJsonResponse(auth);

    return json({ success: true, message: "Cloudflare KV entries expire through TTL" });
  }

  // HTML dashboard (catch-all for any non-API path)
  // This allows URLs like /mikaelvesavuori.se?days=7 to work for bookmarking
  return new Response(getDashboardHTML(), {
    headers: { "Content-Type": "text/html" },
  });
}

// Default export for Cloudflare Workers
export default {
  async scheduled(event, env, ctx) {
    return handleScheduled(event, env, ctx);
  },

  async fetch(request, env) {
    return handleFetch(request, env);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function getConfiguredSite(configManager, domain) {
  const sites = await configManager.getSites();
  return sites.find((site) => getSiteDomain(site) === domain);
}

function siteNotConfigured(domain) {
  return json(
    {
      code: "SITE_NOT_CONFIGURED",
      error: `${domain} is not monitored by this MikroAPM instance.`,
    },
    404,
  );
}
