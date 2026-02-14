import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DashboardService } from '../../src/core/DashboardService.js';
import { createTestDb, cleanupTestDb } from '../helpers/testUtils.js';

describe('DashboardService', () => {
  let storage;
  let service;

  beforeEach(() => {
    storage = createTestDb('dashboard');
    service = new DashboardService(storage);
  });

  afterEach(() => {
    cleanupTestDb(storage);
  });

  describe('getUptimeData', () => {
    it('should return N/A uptime when no data exists', async () => {
      const data = await service.getUptimeData('example.com', 7);

      expect(data.domain).toBe('example.com');
      expect(data.uptime).toBe('N/A');
      expect(data.period).toBe('7 days');
      expect(data.totalChecks).toBe(0);
      expect(data.totalFailures).toBe(0);
      expect(data.dailySummaries).toHaveLength(7);
    });

    it('should calculate uptime from stored data', async () => {
      const today = new Date().toISOString().split('T')[0];

      await storage.put(
        `summary:example.com:${today}`,
        JSON.stringify({ checks: 100, failures: 5, uptime: '95.00%' })
      );

      const data = await service.getUptimeData('example.com', 1);

      expect(data.domain).toBe('example.com');
      expect(data.totalChecks).toBe(100);
      expect(data.totalFailures).toBe(5);
      expect(data.uptime).toBe('95.00%');
    });

    it('should aggregate multiple days correctly', async () => {
      const dates = [];
      for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      // Day 0: 100 checks, 10 failures (90%)
      await storage.put(
        `summary:example.com:${dates[0]}`,
        JSON.stringify({ checks: 100, failures: 10, uptime: '90.00%' })
      );

      // Day 1: 100 checks, 5 failures (95%)
      await storage.put(
        `summary:example.com:${dates[1]}`,
        JSON.stringify({ checks: 100, failures: 5, uptime: '95.00%' })
      );

      // Day 2: 100 checks, 0 failures (100%)
      await storage.put(
        `summary:example.com:${dates[2]}`,
        JSON.stringify({ checks: 100, failures: 0, uptime: '100.00%' })
      );

      const data = await service.getUptimeData('example.com', 3);

      expect(data.totalChecks).toBe(300);
      expect(data.totalFailures).toBe(15);
      expect(data.uptime).toBe('95.00%');
      expect(data.dailySummaries).toHaveLength(3);
    });

    it('should return summaries in chronological order (oldest first)', async () => {
      const data = await service.getUptimeData('example.com', 3);

      const dates = data.dailySummaries.map(s => s.date);
      const sortedDates = [...dates].sort();

      expect(dates).toEqual(sortedDates);
    });

    it('should handle mixed data (some days with data, some without)', async () => {
      const dates = [];
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      // Days 0-1: Have data
      await storage.put(
        `summary:example.com:${dates[0]}`,
        JSON.stringify({ checks: 100, failures: 5, uptime: '95.00%' })
      );
      await storage.put(
        `summary:example.com:${dates[1]}`,
        JSON.stringify({ checks: 100, failures: 0, uptime: '100.00%' })
      );
      // Days 2-4: No data (will default to checks: 0, failures: 0, uptime: "N/A")

      const data = await service.getUptimeData('example.com', 5);

      // Should only count the days that have actual data
      expect(data.totalChecks).toBe(200);
      expect(data.totalFailures).toBe(5);
      expect(data.uptime).toBe('97.50%');  // (200 - 5) / 200 = 97.5%
      expect(data.dailySummaries).toHaveLength(5);

      // Check that days without data have N/A
      expect(data.dailySummaries[0].uptime).toBe('N/A');  // Oldest day (day 4)
      expect(data.dailySummaries[3].uptime).toBe('100.00%');  // Day 1
      expect(data.dailySummaries[4].uptime).toBe('95.00%');  // Day 0 (newest)
    });
  });

  describe('getDayFailures', () => {
    it('should return empty failures when none exist', async () => {
      const today = new Date().toISOString().split('T')[0];
      const data = await service.getDayFailures('example.com', today);

      expect(data.domain).toBe('example.com');
      expect(data.date).toBe(today);
      expect(data.failures).toEqual([]);
    });

    it('should return failures for a specific day', async () => {
      const today = new Date().toISOString().split('T')[0];
      const timestamp1 = Date.now();
      const timestamp2 = timestamp1 + 60000;

      await storage.put(
        `failure:example.com:${today}:10:00:${timestamp1}`,
        JSON.stringify({ status: 500, message: 'Server Error', duration: 120 })
      );

      await storage.put(
        `failure:example.com:${today}:10:05:${timestamp2}`,
        JSON.stringify({ status: 0, message: 'Timeout', duration: 5000 })
      );

      const data = await service.getDayFailures('example.com', today);

      expect(data.failures).toHaveLength(2);
      expect(data.failures[0]).toMatchObject({
        timestamp: timestamp1,
        status: 500,
        message: 'Server Error',
        duration: 120
      });
      expect(data.failures[1]).toMatchObject({
        timestamp: timestamp2,
        status: 0,
        message: 'Timeout',
        duration: 5000
      });
    });

    it('should sort failures by timestamp', async () => {
      const today = new Date().toISOString().split('T')[0];
      const timestamps = [
        Date.now(),
        Date.now() + 60000,
        Date.now() + 120000
      ];

      // Store in reverse order
      for (let i = timestamps.length - 1; i >= 0; i--) {
        await storage.put(
          `failure:example.com:${today}:10:0${i}:${timestamps[i]}`,
          JSON.stringify({ status: 500, message: 'Error', duration: 100 })
        );
      }

      const data = await service.getDayFailures('example.com', today);

      expect(data.failures).toHaveLength(3);
      expect(data.failures[0].timestamp).toBe(timestamps[0]);
      expect(data.failures[1].timestamp).toBe(timestamps[1]);
      expect(data.failures[2].timestamp).toBe(timestamps[2]);
    });

    it('should respect the 1000 limit', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Store more than 1000 failures
      for (let i = 0; i < 1500; i++) {
        await storage.put(
          `failure:example.com:${today}:10:00:${Date.now() + i}`,
          JSON.stringify({ status: 500, message: 'Error', duration: 100 })
        );
      }

      const data = await service.getDayFailures('example.com', today);

      expect(data.failures.length).toBeLessThanOrEqual(1000);
    });
  });
});
