/**
 * Dashboard service for querying uptime data
 */
export class DashboardService {
  constructor(storage) {
    this.storage = storage;
  }

  async getUptimeData(domain, days) {
    const dates = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split("T")[0]);
    }

    const summaries = await Promise.all(
      dates.map(async (date) => {
        const key = `summary:${domain}:${date}`;
        const data = await this.storage.get(key, "json");
        return { date, ...(data || { checks: 0, failures: 0, uptime: "N/A" }) };
      }),
    );

    const totalChecks = summaries.reduce((sum, s) => sum + s.checks, 0);
    const totalFailures = summaries.reduce((sum, s) => sum + s.failures, 0);

    let overallUptime = "N/A";
    if (totalChecks > 0) {
      const uptimeValue = ((totalChecks - totalFailures) / totalChecks) * 100;
      // Show no decimals for 0% and 100%, otherwise show 2 decimals
      if (uptimeValue === 0 || uptimeValue === 100) {
        overallUptime = uptimeValue.toFixed(0);
      } else {
        overallUptime = uptimeValue.toFixed(2);
      }
    }

    return {
      domain,
      uptime: overallUptime === "N/A" ? "N/A" : `${overallUptime}%`,
      period: `${days} days`,
      totalChecks,
      totalFailures,
      dailySummaries: summaries.reverse(),
    };
  }

  async getDayFailures(domain, date) {
    const prefix = `failure:${domain}:${date}:`;
    const list = await this.storage.list({ prefix, limit: 1000 });

    const failures = [];
    for (const key of list.keys) {
      const parts = key.name.split(":");
      const timestamp = parseInt(parts[parts.length - 1], 10);
      const value = await this.storage.get(key.name, "json");
      failures.push({ timestamp, ...value });
    }

    failures.sort((a, b) => a.timestamp - b.timestamp);

    return {
      domain,
      date,
      failures,
    };
  }
}
