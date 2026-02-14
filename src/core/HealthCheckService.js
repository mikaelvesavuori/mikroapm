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
    const start = Date.now();
    const timestamp = start;
    const domain = new URL(site.url).hostname;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), site.timeout);

      const response = await fetch(site.url, {
        signal: controller.signal,
        headers: { "User-Agent": "MikroAPM/1.0" },
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - start;

      if (!response.ok) {
        await this.storeFailure(domain, timestamp, {
          status: response.status,
          message: `HTTP ${response.status}`,
          duration,
        });

        await this.handleAlert(site, domain, {
          status: response.status,
          message: `HTTP ${response.status}`,
          duration,
        });
      } else {
        await this.clearFailureCount(domain);
      }
    } catch (error) {
      const duration = Date.now() - start;

      await this.storeFailure(domain, timestamp, {
        status: 0,
        message: error.message,
        duration,
      });

      await this.handleAlert(site, domain, {
        status: 0,
        message: error.message,
        duration,
      });
    }
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
    }
  }

  async clearFailureCount(domain) {
    const failureCountKey = `failure-count:${domain}`;
    await this.storage.delete(failureCountKey);
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
