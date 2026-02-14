import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HealthCheckService } from '../../src/core/HealthCheckService.js';
import { ConfigManager } from '../../src/core/ConfigManager.js';
import { AlertService } from '../../src/core/AlertService.js';
import { createTestDb, cleanupTestDb } from '../helpers/testUtils.js';

describe('HealthCheckService', () => {
  let storage;
  let config;
  let alertService;
  let service;

  beforeEach(() => {
    storage = createTestDb('health-check');

    const configData = {
      sites: [{ url: 'https://example.com', timeout: 10000 }],
      alerts: {
        threshold: 3,
        fromEmail: 'from@test.com',
        fromName: 'Test',
        toEmail: 'to@test.com'
      }
    };

    config = ConfigManager.create(storage, { BREVO_API_KEY: 'test-key' }, configData);
    alertService = new AlertService(config);
    // Use a test session start time from 1 hour ago
    const testSessionStart = Date.now() - (60 * 60 * 1000);
    service = new HealthCheckService(storage, config, alertService, testSessionStart);
  });

  afterEach(() => {
    cleanupTestDb(storage);
    vi.restoreAllMocks();
  });

  describe('storeFailure', () => {
    it('should store failure with correct key format', async () => {
      const timestamp = Date.now();
      const domain = 'example.com';
      const failureData = {
        status: 500,
        message: 'Server Error',
        duration: 150
      };

      await service.storeFailure(domain, timestamp, failureData);

      const date = new Date(timestamp).toISOString().split('T')[0];
      const timeStr = new Date(timestamp).toISOString().slice(11, 16);
      const expectedKey = `failure:${domain}:${date}:${timeStr}:${timestamp}`;

      const stored = await storage.get(expectedKey, 'json');
      expect(stored).toEqual(failureData);
    });

    it('should store multiple failures for same domain', async () => {
      const domain = 'example.com';
      const timestamp1 = Date.now();
      const timestamp2 = timestamp1 + 60000;

      await service.storeFailure(domain, timestamp1, {
        status: 500,
        message: 'Error 1',
        duration: 100
      });

      await service.storeFailure(domain, timestamp2, {
        status: 503,
        message: 'Error 2',
        duration: 200
      });

      const today = new Date().toISOString().split('T')[0];
      const failures = await storage.list({ prefix: `failure:${domain}:${today}:` });

      expect(failures.keys.length).toBe(2);
    });
  });

  describe('handleAlert', () => {
    it('should increment failure count', async () => {
      const site = { url: 'https://example.com', timeout: 10000 };
      const domain = 'example.com';
      const failureData = { status: 500, message: 'Error', duration: 100 };

      await service.handleAlert(site, domain, failureData);

      const count = await storage.get('failure-count:example.com');
      expect(count).toBe('1');
    });

    it('should send alert when threshold is reached', async () => {
      const site = { url: 'https://example.com', timeout: 10000 };
      const domain = 'example.com';
      const failureData = { status: 500, message: 'Error', duration: 100 };

      const sendAlertSpy = vi.spyOn(alertService, 'sendAlert');

      // First two failures - no alert
      await service.handleAlert(site, domain, failureData);
      await service.handleAlert(site, domain, failureData);

      expect(sendAlertSpy).not.toHaveBeenCalled();

      // Third failure - alert should be sent
      await service.handleAlert(site, domain, failureData);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        site,
        domain,
        failureData,
        3
      );
    });

    it('should not send alert before threshold', async () => {
      const site = { url: 'https://example.com', timeout: 10000 };
      const domain = 'example.com';
      const failureData = { status: 500, message: 'Error', duration: 100 };

      const sendAlertSpy = vi.spyOn(alertService, 'sendAlert');

      await service.handleAlert(site, domain, failureData);
      await service.handleAlert(site, domain, failureData);

      expect(sendAlertSpy).not.toHaveBeenCalled();
    });
  });

  describe('clearFailureCount', () => {
    it('should remove failure count', async () => {
      const domain = 'example.com';

      await storage.put('failure-count:example.com', '5');

      await service.clearFailureCount(domain);

      const count = await storage.get('failure-count:example.com');
      expect(count).toBeNull();
    });
  });

  describe('getOrSetMonitoringStart', () => {
    it('should store monitoring start timestamp on first call', async () => {
      const domain = 'example.com';
      const beforeCall = Date.now();

      const timestamp = await service.getOrSetMonitoringStart(domain);

      const afterCall = Date.now();

      expect(timestamp).toBeGreaterThanOrEqual(beforeCall);
      expect(timestamp).toBeLessThanOrEqual(afterCall);

      const stored = await storage.get(`monitoring-start:${domain}`);
      expect(stored).toBe(timestamp.toString());
    });

    it('should return existing timestamp on subsequent calls', async () => {
      const domain = 'example.com';

      const firstTimestamp = await service.getOrSetMonitoringStart(domain);

      // Wait a bit to ensure time has passed
      await new Promise(resolve => setTimeout(resolve, 10));

      const secondTimestamp = await service.getOrSetMonitoringStart(domain);

      expect(secondTimestamp).toBe(firstTimestamp);
    });

    it('should handle different domains independently', async () => {
      const timestamp1 = await service.getOrSetMonitoringStart('domain1.com');

      await new Promise(resolve => setTimeout(resolve, 10));

      const timestamp2 = await service.getOrSetMonitoringStart('domain2.com');

      expect(timestamp1).not.toBe(timestamp2);
      expect(timestamp2).toBeGreaterThan(timestamp1);
    });
  });

  describe('updateDailySummaries', () => {
    it('should create summary for each site', async () => {
      const sites = [
        { url: 'https://site1.com', timeout: 10000 },
        { url: 'https://site2.com', timeout: 10000 }
      ];

      // Set monitoring start to 1 hour ago so checks > 0
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      await storage.put('monitoring-start:site1.com', oneHourAgo.toString());
      await storage.put('monitoring-start:site2.com', oneHourAgo.toString());

      await service.updateDailySummaries(sites);

      const today = new Date().toISOString().split('T')[0];
      const summary1 = await storage.get(`summary:site1.com:${today}`, 'json');
      const summary2 = await storage.get(`summary:site2.com:${today}`, 'json');

      expect(summary1).toBeDefined();
      expect(summary1.checks).toBeGreaterThan(0);
      expect(summary1.failures).toBe(0);
      expect(summary1.uptime).toBe('100.00%');

      expect(summary2).toBeDefined();
      expect(summary2.checks).toBeGreaterThan(0);
      expect(summary2.failures).toBe(0);
      expect(summary2.uptime).toBe('100.00%');
    });

    it('should include failures in summary calculation', async () => {
      const sites = [{ url: 'https://example.com', timeout: 10000 }];
      const today = new Date().toISOString().split('T')[0];
      const timestamp = Date.now();

      // Set monitoring start to 1 hour ago so there are expected checks
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      await storage.put('monitoring-start:example.com', oneHourAgo.toString());

      // Store some failures
      await storage.put(
        `failure:example.com:${today}:10:00:${timestamp}`,
        JSON.stringify({ status: 500, message: 'Error', duration: 100 })
      );

      await storage.put(
        `failure:example.com:${today}:10:05:${timestamp + 300000}`,
        JSON.stringify({ status: 503, message: 'Error', duration: 100 })
      );

      await service.updateDailySummaries(sites);

      const summary = await storage.get(`summary:example.com:${today}`, 'json');

      expect(summary).toBeDefined();
      expect(summary.failures).toBe(2);
      expect(parseFloat(summary.uptime)).toBeLessThan(100);
    });

    it('should calculate checks from monitoring start time', async () => {
      const sites = [{ url: 'https://example.com', timeout: 10000 }];
      const checkInterval = config.getCheckIntervalMinutes();

      // Set monitoring start to 30 minutes ago
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      await storage.put('monitoring-start:example.com', thirtyMinutesAgo.toString());

      await service.updateDailySummaries(sites);

      const today = new Date().toISOString().split('T')[0];
      const summary = await storage.get(`summary:example.com:${today}`, 'json');

      expect(summary).toBeDefined();
      // Should calculate based on ~30 minutes of monitoring
      const expectedChecks = Math.floor(30 / checkInterval);
      expect(summary.checks).toBe(expectedChecks);
    });

    it('should show zero checks when monitoring just started', async () => {
      const sites = [{ url: 'https://example.com', timeout: 10000 }];

      // Set monitoring start to current time
      const now = Date.now();
      await storage.put('monitoring-start:example.com', now.toString());

      await service.updateDailySummaries(sites);

      const today = new Date().toISOString().split('T')[0];
      const summary = await storage.get(`summary:example.com:${today}`, 'json');

      expect(summary).toBeDefined();
      expect(summary.checks).toBe(0);
      expect(summary.failures).toBe(0);
      expect(summary.uptime).toBe('100.00%');
    });

    it('should use start of day when monitoring started before today', async () => {
      const sites = [{ url: 'https://example.com', timeout: 10000 }];

      // Set monitoring start to yesterday
      const yesterday = Date.now() - (24 * 60 * 60 * 1000);
      await storage.put('monitoring-start:example.com', yesterday.toString());

      await service.updateDailySummaries(sites);

      const today = new Date().toISOString().split('T')[0];
      const summary = await storage.get(`summary:example.com:${today}`, 'json');

      expect(summary).toBeDefined();
      // Should calculate from start of today, not from yesterday
      expect(summary.checks).toBeGreaterThan(0);
    });

    it('should use service session start when it is more recent than start of day', async () => {
      const sites = [{ url: 'https://example.com', timeout: 10000 }];

      // Set monitoring start to yesterday (well before today)
      const yesterday = Date.now() - (24 * 60 * 60 * 1000);
      await storage.put('monitoring-start:example.com', yesterday.toString());

      // Create a service that started 30 minutes ago (mid-day reboot scenario)
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      const serviceWithRecentStart = new HealthCheckService(storage, config, alertService, thirtyMinutesAgo);

      await serviceWithRecentStart.updateDailySummaries(sites);

      const today = new Date().toISOString().split('T')[0];
      const summary = await storage.get(`summary:example.com:${today}`, 'json');

      expect(summary).toBeDefined();
      // Should calculate based on ~30 minutes, not full day
      const checkInterval = config.getCheckIntervalMinutes();
      const expectedChecks = Math.floor(30 / checkInterval);
      expect(summary.checks).toBe(expectedChecks);
    });
  });

  describe('runChecks', () => {
    it('should run checks for all sites', async () => {
      const checkSiteSpy = vi.spyOn(service, 'checkSite').mockResolvedValue();

      const sites = [
        { url: 'https://site1.com', timeout: 10000 },
        { url: 'https://site2.com', timeout: 10000 },
        { url: 'https://site3.com', timeout: 10000 }
      ];

      await service.runChecks(sites);

      expect(checkSiteSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle check failures gracefully', async () => {
      vi.spyOn(service, 'checkSite')
        .mockRejectedValueOnce(new Error('Check failed'))
        .mockResolvedValueOnce();

      const sites = [
        { url: 'https://site1.com', timeout: 10000 },
        { url: 'https://site2.com', timeout: 10000 }
      ];

      await expect(service.runChecks(sites)).resolves.not.toThrow();
    });

    it('should initialize monitoring start timestamps for all sites', async () => {
      vi.spyOn(service, 'checkSite').mockResolvedValue();

      const sites = [
        { url: 'https://site1.com', timeout: 10000 },
        { url: 'https://site2.com', timeout: 10000 }
      ];

      await service.runChecks(sites);

      const timestamp1 = await storage.get('monitoring-start:site1.com');
      const timestamp2 = await storage.get('monitoring-start:site2.com');

      expect(timestamp1).toBeDefined();
      expect(timestamp2).toBeDefined();
      expect(parseInt(timestamp1, 10)).toBeGreaterThan(0);
      expect(parseInt(timestamp2, 10)).toBeGreaterThan(0);
    });

    it('should not overwrite existing monitoring start timestamps', async () => {
      vi.spyOn(service, 'checkSite').mockResolvedValue();

      const sites = [{ url: 'https://example.com', timeout: 10000 }];

      // Set initial timestamp
      const initialTimestamp = Date.now() - 60000; // 1 minute ago
      await storage.put('monitoring-start:example.com', initialTimestamp.toString());

      await service.runChecks(sites);

      const storedTimestamp = await storage.get('monitoring-start:example.com');

      expect(storedTimestamp).toBe(initialTimestamp.toString());
    });
  });
});
