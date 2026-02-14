import { AlertService } from "../../core/AlertService.js";
import { ConfigManager } from "../../core/ConfigManager.js";
import { DashboardService } from "../../core/DashboardService.js";
import { HealthCheckService } from "../../core/HealthCheckService.js";
import { KVStorage } from "../../storage/KVStorage.js";
import { getDashboardHTML } from "../dashboard-template.js";

/**
 * Create Cloudflare Workers handler for MikroAPM
 * This module exports the handler for both scheduled (health checks) and fetch (dashboard) events
 */

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

  // Run all health checks
  const checks = sites.map((site) => healthCheckService.checkSite(site));
  await Promise.allSettled(checks);

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

  // API endpoint for uptime data
  if (url.pathname.startsWith("/api/uptime/")) {
    const domain = url.pathname.split("/api/uptime/")[1];
    const days = parseInt(url.searchParams.get("days") || "30", 10);

    try {
      const data = await dashboardService.getUptimeData(domain, days);
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // API endpoint for day-specific failures
  if (url.pathname.startsWith("/api/failures/")) {
    const pathParts = url.pathname.split("/");
    const domain = pathParts[3];
    const date = pathParts[4];

    try {
      const data = await dashboardService.getDayFailures(domain, date);
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // API endpoint for sites configuration
  if (url.pathname === "/api/sites") {
    if (request.method === "GET") {
      try {
        const sites = await configManager.getSites();
        return new Response(JSON.stringify(sites), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (request.method === "POST") {
      try {
        const sites = await request.json();
        await configManager.setSites(sites);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
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
