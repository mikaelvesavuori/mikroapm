import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AlertService } from '../../src/core/AlertService.js';
import { ConfigManager } from '../../src/core/ConfigManager.js';
import { createTestDb, cleanupTestDb } from '../helpers/testUtils.js';

describe('AlertService', () => {
  let storage;
  let config;
  let service;
  let fetchSpy;

  beforeEach(() => {
    storage = createTestDb('alert-service');
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    cleanupTestDb(storage);
    vi.restoreAllMocks();
  });

  describe('sendAlert', () => {
    it('should not send alert when alerts are not configured', async () => {
      const configData = {
        sites: [{ url: 'https://example.com' }]
      };

      config = ConfigManager.create(storage, {}, configData);
      service = new AlertService(config);

      const site = { url: 'https://example.com', timeout: 10000 };
      const failureData = { status: 500, message: 'Error', duration: 100 };

      await service.sendAlert(site, 'example.com', failureData, 3);

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should not send alert when BREVO_API_KEY is missing', async () => {
      const configData = {
        sites: [{ url: 'https://example.com' }],
        alerts: {
          threshold: 3,
          fromEmail: 'from@test.com',
          fromName: 'Test',
          toEmail: 'to@test.com'
        }
      };

      config = ConfigManager.create(storage, {}, configData);
      service = new AlertService(config);

      const site = { url: 'https://example.com', timeout: 10000 };
      const failureData = { status: 500, message: 'Error', duration: 100 };

      await service.sendAlert(site, 'example.com', failureData, 3);

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should send alert with correct parameters', async () => {
      const configData = {
        sites: [{ url: 'https://example.com' }],
        alerts: {
          threshold: 3,
          fromEmail: 'from@test.com',
          fromName: 'Test Monitor',
          toEmail: 'to@test.com'
        }
      };

      config = ConfigManager.create(storage, { BREVO_API_KEY: 'test-key-123' }, configData);
      service = new AlertService(config);

      fetchSpy.mockResolvedValue({ ok: true });

      const site = { url: 'https://example.com', timeout: 10000 };
      const failureData = { status: 500, message: 'Server Error', duration: 150 };

      await service.sendAlert(site, 'example.com', failureData, 3);

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.brevo.com/v3/smtp/email',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'api-key': 'test-key-123'
          })
        })
      );

      const callArgs = fetchSpy.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.sender).toEqual({
        name: 'Test Monitor',
        email: 'from@test.com'
      });

      expect(body.to).toEqual([
        { email: 'to@test.com', name: 'to' }
      ]);

      expect(body.subject).toBe('🚨 Alert: example.com is DOWN');
      expect(body.htmlContent).toContain('example.com');
      expect(body.htmlContent).toContain('500');
      expect(body.htmlContent).toContain('Server Error');
    });

    it('should use site-specific alertEmail when provided', async () => {
      const configData = {
        sites: [{ url: 'https://example.com' }],
        alerts: {
          threshold: 3,
          fromEmail: 'from@test.com',
          fromName: 'Test',
          toEmail: 'default@test.com'
        }
      };

      config = ConfigManager.create(storage, { BREVO_API_KEY: 'test-key' }, configData);
      service = new AlertService(config);

      fetchSpy.mockResolvedValue({ ok: true });

      const site = {
        url: 'https://example.com',
        timeout: 10000,
        alertEmail: 'custom@test.com'
      };
      const failureData = { status: 500, message: 'Error', duration: 100 };

      await service.sendAlert(site, 'example.com', failureData, 3);

      const callArgs = fetchSpy.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.to[0].email).toBe('custom@test.com');
    });

    it('should handle API errors gracefully', async () => {
      const configData = {
        sites: [{ url: 'https://example.com' }],
        alerts: {
          threshold: 3,
          fromEmail: 'from@test.com',
          fromName: 'Test',
          toEmail: 'to@test.com'
        }
      };

      config = ConfigManager.create(storage, { BREVO_API_KEY: 'test-key' }, configData);
      service = new AlertService(config);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetchSpy.mockResolvedValue({
        ok: false,
        text: async () => 'API Error'
      });

      const site = { url: 'https://example.com', timeout: 10000 };
      const failureData = { status: 500, message: 'Error', duration: 100 };

      await service.sendAlert(site, 'example.com', failureData, 3);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Brevo API error:', 'API Error');
      consoleErrorSpy.mockRestore();
    });

    it('should handle fetch failures gracefully', async () => {
      const configData = {
        sites: [{ url: 'https://example.com' }],
        alerts: {
          threshold: 3,
          fromEmail: 'from@test.com',
          fromName: 'Test',
          toEmail: 'to@test.com'
        }
      };

      config = ConfigManager.create(storage, { BREVO_API_KEY: 'test-key' }, configData);
      service = new AlertService(config);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetchSpy.mockRejectedValue(new Error('Network error'));

      const site = { url: 'https://example.com', timeout: 10000 };
      const failureData = { status: 500, message: 'Error', duration: 100 };

      await service.sendAlert(site, 'example.com', failureData, 3);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to send alert email:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('generateEmailTemplate', () => {
    beforeEach(() => {
      const configData = {
        sites: [{ url: 'https://example.com' }],
        alerts: {
          threshold: 3,
          fromEmail: 'from@test.com',
          fromName: 'Test',
          toEmail: 'to@test.com'
        }
      };

      config = ConfigManager.create(storage, {}, configData);
      service = new AlertService(config);
    });

    it('should generate HTML email template with all data', () => {
      const site = { url: 'https://example.com', timeout: 10000 };
      const failureData = {
        status: 500,
        message: 'Internal Server Error',
        duration: 250
      };

      const html = service.generateEmailTemplate(site, 'example.com', failureData, 5);

      expect(html).toContain('example.com');
      expect(html).toContain('https://example.com');
      expect(html).toContain('500');
      expect(html).toContain('Internal Server Error');
      expect(html).toContain('250ms');
      expect(html).toContain('5');
    });

    it('should handle connection failures (status 0)', () => {
      const site = { url: 'https://example.com', timeout: 10000 };
      const failureData = {
        status: 0,
        message: 'Connection timeout',
        duration: 10000
      };

      const html = service.generateEmailTemplate(site, 'example.com', failureData, 3);

      expect(html).toContain('Connection Failed');
      expect(html).toContain('Connection timeout');
    });
  });
});
