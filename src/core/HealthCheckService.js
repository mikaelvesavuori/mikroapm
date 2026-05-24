import { getSiteDomain, getSiteTimeout, getSuppression } from "./SiteValidator.js";

/**
 * Health check service for monitoring sites
 */
export class HealthCheckService {
  constructor(storage, configManager, alertService, serviceSessionStart = null) {
    this.storage = storage;
    this.config = configManager;
    this.alertService = alertService;
    this.serviceSessionStart = serviceSessionStart;
  }

  async checkSite(site) {
    const timestamp = Date.now();
    const domain = getSiteDomain(site);
    const suppression = getSuppression(site, timestamp);

    if (suppression) {
      const status = {
        domain,
        url: site.url,
        name: site.name,
        status: suppression.status,
        ok: null,
        message: suppression.message,
        checkedAt: timestamp,
        maintenanceWindow: suppression.maintenanceWindow,
      };
      await this.storeStatus(domain, status);
      return status;
    }

    const result = await this.runCheckWithRetries(site, timestamp);

    if (result.ok) {
      const alertState = await this.storage.get(this.getAlertStateKey(domain));
      await this.clearFailureCount(domain);
      await this.clearAlertState(domain);

      const status = {
        domain,
        url: site.url,
        name: site.name,
        status: "operational",
        ok: true,
        httpStatus: result.httpStatus,
        message: result.message,
        duration: result.duration,
        attempts: result.attempts,
        checkedAt: timestamp,
      };
      await this.storeStatus(domain, status);

      if (alertState === "down") {
        await this.alertService.sendRecovery(site, domain, status);
      }

      return status;
    }

    const failureData = {
      status: result.httpStatus || 0,
      message: result.message,
      duration: result.duration,
      attempts: result.attempts,
    };

    await this.storeFailure(domain, timestamp, failureData);
    const consecutiveFailures = await this.handleAlert(site, domain, failureData);

    const status = {
      domain,
      url: site.url,
      name: site.name,
      status: "down",
      ok: false,
      httpStatus: result.httpStatus,
      message: result.message,
      duration: result.duration,
      attempts: result.attempts,
      consecutiveFailures,
      checkedAt: timestamp,
    };
    await this.storeStatus(domain, status);

    return status;
  }

  async runCheckWithRetries(site, timestamp = Date.now()) {
    const retries = site.retries || 0;
    const attempts = retries + 1;
    let result = null;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      result = await this.runCheckAttempt(site, timestamp);
      result.attempts = attempt;

      if (result.ok || attempt === attempts) {
        return result;
      }

      await delay(site.retryDelayMs ?? 1000);
    }

    return result;
  }

  async runCheckAttempt(site, timestamp) {
    const start = Date.now();
    const timeout = getSiteTimeout(site);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const method = site.method || "GET";
      const headers = normalizeRequestHeaders(site.headers);
      const request = {
        method,
        signal: controller.signal,
        headers,
      };

      if (site.body && method !== "GET" && method !== "HEAD") {
        request.body = site.body;
      }

      const response = await fetch(site.url, request);
      const duration = Date.now() - start;

      return await this.evaluateResponse(site, response, duration, timestamp);
    } catch (error) {
      const duration = Date.now() - start;
      const message = error.name === "AbortError" ? `Timeout after ${timeout}ms` : error.message;

      return {
        ok: false,
        httpStatus: 0,
        message,
        duration,
        checkedAt: timestamp,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async evaluateResponse(site, response, duration, timestamp) {
    const expectedStatuses = getExpectedStatuses(site);

    if (expectedStatuses) {
      if (!expectedStatuses.includes(response.status)) {
        return {
          ok: false,
          httpStatus: response.status,
          message: `Expected HTTP ${expectedStatuses.join(", ")}, got ${response.status}`,
          duration,
          checkedAt: timestamp,
        };
      }
    } else if (!response.ok) {
      return {
        ok: false,
        httpStatus: response.status,
        message: `HTTP ${response.status}`,
        duration,
        checkedAt: timestamp,
      };
    }

    if (site.maxLatencyMs && duration > site.maxLatencyMs) {
      return {
        ok: false,
        httpStatus: response.status,
        message: `Latency ${duration}ms exceeded ${site.maxLatencyMs}ms`,
        duration,
        checkedAt: timestamp,
      };
    }

    if (site.expectedText || site.expectedRegex) {
      const text = await response.text();

      if (site.expectedText && !text.includes(site.expectedText)) {
        return {
          ok: false,
          httpStatus: response.status,
          message: "Expected response text was not found",
          duration,
          checkedAt: timestamp,
        };
      }

      if (site.expectedRegex && !new RegExp(site.expectedRegex).test(text)) {
        return {
          ok: false,
          httpStatus: response.status,
          message: "Expected response pattern was not found",
          duration,
          checkedAt: timestamp,
        };
      }
    }

    return {
      ok: true,
      httpStatus: response.status,
      message: "OK",
      duration,
      checkedAt: timestamp,
    };
  }

  async storeStatus(domain, data) {
    await this.storage.put(`status:${domain}`, JSON.stringify(data), {
      expirationTtl: 90 * 24 * 60 * 60,
    });
  }

  async getCurrentStatus(domain) {
    return this.storage.get(`status:${domain}`, "json");
  }

  async storeFailure(domain, timestamp, data) {
    const date = new Date(timestamp);
    const dateStr = date.toISOString().split("T")[0];
    const timeStr = date.toISOString().slice(11, 16);

    const key = `failure:${domain}:${dateStr}:${timeStr}:${timestamp}`;

    await this.storage.put(key, JSON.stringify(data), { expirationTtl: 90 * 24 * 60 * 60 });
  }

  async handleAlert(site, domain, failureData) {
    const threshold = this.config.getAlertThreshold();

    const failureCountKey = `failure-count:${domain}`;
    const currentCount = parseInt((await this.storage.get(failureCountKey)) || "0", 10);
    const newCount = currentCount + 1;

    await this.storage.put(failureCountKey, newCount.toString(), {
      expirationTtl: 600,
    });

    if (newCount === threshold) {
      await this.alertService.sendAlert(site, domain, failureData, newCount);
      await this.storage.put(this.getAlertStateKey(domain), "down", {
        expirationTtl: 90 * 24 * 60 * 60,
      });
    }

    return newCount;
  }

  async clearFailureCount(domain) {
    const failureCountKey = `failure-count:${domain}`;
    await this.storage.delete(failureCountKey);
  }

  async clearAlertState(domain) {
    await this.storage.delete(this.getAlertStateKey(domain));
  }

  getAlertStateKey(domain) {
    return `alert-state:${domain}`;
  }

  async getOrSetMonitoringStart(domain) {
    const key = `monitoring-start:${domain}`;
    const existing = await this.storage.get(key);

    if (existing) {
      return parseInt(existing, 10);
    }

    // First time monitoring this domain - store current timestamp
    const now = Date.now();
    await this.storage.put(key, now.toString());
    return now;
  }

  async runChecks(sites) {
    // Initialize monitoring start timestamps for all sites (only writes on first run)
    await Promise.all(
      sites.map(async (site) => {
        const domain = new URL(site.url).hostname;
        await this.getOrSetMonitoringStart(domain);
      }),
    );

    const checks = sites.map((site) => this.checkSite(site));
    await Promise.allSettled(checks);
  }

  async updateDailySummaries(sites) {
    const today = new Date().toISOString().split("T")[0];
    const now = Date.now();
    const startOfDay = new Date(today).getTime();

    for (const site of sites) {
      const domain = new URL(site.url).hostname;

      if (getSuppression(site, now)) {
        continue;
      }

      // Get when monitoring started for this domain
      const monitoringStart = await this.getOrSetMonitoringStart(domain);

      const failurePrefix = `failure:${domain}:${today}:`;
      const failures = await this.storage.list({ prefix: failurePrefix });

      // Calculate checks from the latest of: monitoring start, start of day, or service session start
      // This ensures we don't count theoretical checks before monitoring began or before this service session started
      const timestamps = [monitoringStart, startOfDay];
      if (this.serviceSessionStart) {
        timestamps.push(this.serviceSessionStart);
      }
      const effectiveStart = Math.max(...timestamps);
      const minutesSinceStart = Math.floor((now - effectiveStart) / 60000);
      const checkInterval = this.config.getCheckIntervalMinutes();
      const checksToday = Math.max(0, Math.floor(minutesSinceStart / checkInterval));
      const failuresToday = failures.keys.length;
      const uptime =
        checksToday > 0
          ? (((checksToday - failuresToday) / checksToday) * 100).toFixed(2)
          : "100.00";

      const summaryKey = `summary:${domain}:${today}`;
      await this.storage.put(
        summaryKey,
        JSON.stringify({
          checks: checksToday,
          failures: failuresToday,
          uptime: `${uptime}%`,
        }),
        { expirationTtl: 90 * 24 * 60 * 60 },
      );
    }
  }
}

function normalizeRequestHeaders(headers = {}) {
  const normalized = { ...headers };
  const hasUserAgent = Object.keys(normalized).some((key) => key.toLowerCase() === "user-agent");

  if (!hasUserAgent) {
    normalized["User-Agent"] = "MikroAPM/1.0";
  }

  return normalized;
}

function getExpectedStatuses(site) {
  if (Array.isArray(site.expectedStatuses) && site.expectedStatuses.length > 0) {
    return site.expectedStatuses;
  }

  if (Number.isInteger(site.expectedStatus)) {
    return [site.expectedStatus];
  }

  return null;
}

async function delay(ms) {
  if (!ms) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}
