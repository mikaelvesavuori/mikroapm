import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigManager } from '../../src/core/ConfigManager.js';
import { AlertService } from '../../src/core/AlertService.js';
import { HealthCheckService } from '../../src/core/HealthCheckService.js';
import { DashboardService } from '../../src/core/DashboardService.js';
import { createTestDb, cleanupTestDb } from '../helpers/testUtils.js';

describe('Integration: Complete Flow', () => {
  let storage;
  let config;
  let alertService;
  let healthCheckService;
  let dashboardService;

  beforeEach(() => {
    storage = createTestDb('integration');

    const configData = {
      sites: [
        { url: 'https://httpbin.org/status/200', timeout: 10000 },
        { url: 'https://httpbin.org/delay/1', timeout: 5000 }
      ],
      alerts: {
        threshold: 2,
        fromEmail: 'test@example.com',
        fromName: 'Test Monitor',
        toEmail: 'admin@example.com'
      }
    };

    config = ConfigManager.create(storage, { BREVO_API_KEY: 'test-key' }, configData);
    alertService = new AlertService(config);
    healthCheckService = new HealthCheckService(storage, config, alertService);
    dashboardService = new DashboardService(storage);
  });

  afterEach(() => {
    cleanupTestDb(storage);
  });

  it('should complete full monitoring cycle', async () => {
    // 1. Get initial sites
    const sites = await config.getSites();
    expect(sites).toHaveLength(2);

    // Set monitoring start to 1 hour ago so checks will be calculated
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    await storage.put('monitoring-start:httpbin.org', oneHourAgo.toString());

    // 2. Run health checks
    await healthCheckService.runChecks(sites);

    // 3. Update daily summaries
    await healthCheckService.updateDailySummaries(sites);

    // 4. Verify summaries were created
    const today = new Date().toISOString().split('T')[0];
    const summary1 = await storage.get('summary:httpbin.org:' + today, 'json');
    const summary2 = await storage.get('summary:httpbin.org:' + today, 'json');

    expect(summary1).toBeDefined();
    expect(summary1.checks).toBeGreaterThan(0);
    expect(summary2).toBeDefined();

    // 5. Get uptime data via dashboard service
    const uptimeData = await dashboardService.getUptimeData('httpbin.org', 1);

    expect(uptimeData.domain).toBe('httpbin.org');
    expect(uptimeData.totalChecks).toBeGreaterThan(0);
  });

  it('should handle site configuration updates', async () => {
    // 1. Get initial sites
    const initialSites = await config.getSites();
    expect(initialSites).toHaveLength(2);

    // 2. Update sites
    const newSites = [
      { url: 'https://example.com', timeout: 10000 },
      { url: 'https://example.org', timeout: 10000 },
      { url: 'https://example.net', timeout: 10000 }
    ];

    await config.setSites(newSites);

    // 3. Verify sites were updated
    const updatedSites = await config.getSites();
    expect(updatedSites).toEqual(newSites);
    expect(updatedSites).toHaveLength(3);

    // 4. Run checks with new sites
    await healthCheckService.runChecks(updatedSites);
    await healthCheckService.updateDailySummaries(updatedSites);

    // 5. Verify summaries for new sites
    const today = new Date().toISOString().split('T')[0];
    const summary = await storage.get(`summary:example.com:${today}`, 'json');

    expect(summary).toBeDefined();
  });

  it('should track failures across multiple checks', async () => {
    // Use a site that will definitely fail
    const failingSite = {
      url: 'https://this-domain-definitely-does-not-exist-12345.com',
      timeout: 2000
    };

    const domain = 'this-domain-definitely-does-not-exist-12345.com';

    // Set monitoring start to 1 hour ago so checks will be calculated
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    await storage.put(`monitoring-start:${domain}`, oneHourAgo.toString());

    // Run multiple checks to trigger failures
    for (let i = 0; i < 3; i++) {
      await healthCheckService.checkSite(failingSite);
    }

    // Verify failures were stored
    const today = new Date().toISOString().split('T')[0];
    const failures = await storage.list({ prefix: `failure:${domain}:${today}:` });

    expect(failures.keys.length).toBeGreaterThan(0);

    // Update summaries
    await healthCheckService.updateDailySummaries([failingSite]);

    // Verify summary reflects failures
    const summary = await storage.get(`summary:${domain}:${today}`, 'json');

    expect(summary).toBeDefined();
    expect(summary.failures).toBeGreaterThan(0);
    expect(parseFloat(summary.uptime)).toBeLessThan(100);

    // Get failures via dashboard service
    const dayFailures = await dashboardService.getDayFailures(domain, today);

    expect(dayFailures.failures.length).toBeGreaterThan(0);
    expect(dayFailures.failures[0]).toHaveProperty('timestamp');
    expect(dayFailures.failures[0]).toHaveProperty('status');
    expect(dayFailures.failures[0]).toHaveProperty('message');
    expect(dayFailures.failures[0]).toHaveProperty('duration');
  }, 15000);

  it('should maintain data consistency across services', async () => {
    const sites = await config.getSites();
    const domain = new URL(sites[0].url).hostname;

    // Store some test failure data
    const today = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();

    await healthCheckService.storeFailure(domain, timestamp, {
      status: 500,
      message: 'Test Error',
      duration: 100
    });

    await healthCheckService.storeFailure(domain, timestamp + 60000, {
      status: 503,
      message: 'Service Unavailable',
      duration: 150
    });

    // Update summaries
    await healthCheckService.updateDailySummaries(sites);

    // Verify via dashboard service
    const uptimeData = await dashboardService.getUptimeData(domain, 1);
    expect(uptimeData.totalFailures).toBeGreaterThanOrEqual(2);

    const dayFailures = await dashboardService.getDayFailures(domain, today);
    expect(dayFailures.failures.length).toBeGreaterThanOrEqual(2);

    // Verify data in storage directly
    const summary = await storage.get(`summary:${domain}:${today}`, 'json');
    expect(summary.failures).toBeGreaterThanOrEqual(2);
  });
});
