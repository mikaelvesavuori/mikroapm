import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ConfigManager } from "../../src/core/ConfigManager.js";
import { cleanupTestDb, createTestDb } from "../helpers/testUtils.js";

describe("ConfigManager", () => {
  let storage;

  beforeEach(() => {
    storage = createTestDb("config-manager");
  });

  afterEach(() => {
    cleanupTestDb(storage);
  });

  describe("create", () => {
    it("should create ConfigManager from valid config", () => {
      const config = {
        sites: [{ url: "https://example.com", timeout: 10000 }],
        public: { password: "public-secret" },
      };

      const manager = ConfigManager.create(storage, {}, config);

      expect(manager).toBeInstanceOf(ConfigManager);
      expect(manager.config.sites).toEqual([
        {
          url: "https://example.com",
          name: "example.com",
          timeout: 10000,
          method: "GET",
          headers: {},
          paused: false,
          retries: 0,
          retryDelayMs: 1000,
        },
      ]);
      expect(manager.config.checkIntervalMinutes).toBe(1);
      expect(manager.config.enableSummaryWrites).toBe(true);
      expect(manager.config.alerts).toBeUndefined();
      expect(manager.getPublicPassword()).toBe("public-secret");
    });

    it("should allow empty config without sites (for Workers)", () => {
      const config = {};

      const manager = ConfigManager.create(storage, {}, config);
      expect(manager).toBeInstanceOf(ConfigManager);
      expect(manager.config.sites).toEqual([]);
    });

    it("should throw error for empty sites array", () => {
      const config = { sites: [] };

      expect(() => {
        ConfigManager.create(storage, {}, config);
      }).toThrow("Invalid config");
    });

    it("should throw error for invalid site URL", () => {
      const config = {
        sites: [{ timeout: 10000 }],
      };

      expect(() => {
        ConfigManager.create(storage, {}, config);
      }).toThrow("Invalid config");
    });

    it("should accept config with alerts from config file", () => {
      const config = {
        sites: [{ url: "https://example.com" }],
        alerts: {
          threshold: 3,
          fromEmail: "from@example.com",
          fromName: "Test",
          toEmail: "to@example.com",
        },
      };

      const manager = ConfigManager.create(storage, {}, config);

      expect(manager.hasAlerts()).toBe(true);
      expect(manager.getAlertThreshold()).toBe(3);
      expect(manager.getAlertFromEmail()).toBe("from@example.com");
      expect(manager.getAlertFromName()).toBe("Test");
      expect(manager.getAlertToEmail()).toBe("to@example.com");
    });

    it("should create ConfigManager from env vars only", () => {
      const env = {
        ALERT_FROM_EMAIL: "alerts@test.com",
        ALERT_TO_EMAIL: "admin@test.com",
        ALERT_THRESHOLD: "5",
        ALERT_FROM_NAME: "TestAPM",
      };

      const manager = ConfigManager.create(storage, env);

      expect(manager).toBeInstanceOf(ConfigManager);
      expect(manager.hasAlerts()).toBe(true);
      expect(manager.getAlertThreshold()).toBe(5);
      expect(manager.getAlertFromEmail()).toBe("alerts@test.com");
      expect(manager.getAlertFromName()).toBe("TestAPM");
      expect(manager.getAlertToEmail()).toBe("admin@test.com");
    });

    it("should create ConfigManager without alerts when env vars missing", () => {
      const manager = ConfigManager.create(storage, {});

      expect(manager).toBeInstanceOf(ConfigManager);
      expect(manager.hasAlerts()).toBe(false);
      expect(manager.getAlertThreshold()).toBe(3);
    });

    it("should use default threshold when not provided", () => {
      const env = {
        ALERT_FROM_EMAIL: "test@test.com",
        ALERT_TO_EMAIL: "admin@test.com",
      };

      const manager = ConfigManager.create(storage, env);

      expect(manager.getAlertThreshold()).toBe(3);
    });

    it("should prioritize env vars over config file", () => {
      const config = {
        sites: [{ url: "https://example.com" }],
        alerts: {
          threshold: 3,
          fromEmail: "config@example.com",
          toEmail: "config-admin@example.com",
        },
      };

      const env = {
        ALERT_THRESHOLD: "5",
        ALERT_FROM_EMAIL: "env@example.com",
      };

      const manager = ConfigManager.create(storage, env, config);

      expect(manager.getAlertThreshold()).toBe(5);
      expect(manager.getAlertFromEmail()).toBe("env@example.com");
      expect(manager.getAlertToEmail()).toBe("config-admin@example.com"); // Falls back to config
    });

    it("should resolve scheduler settings from env vars before config values", () => {
      const config = {
        sites: [{ url: "https://example.com" }],
        checkIntervalMinutes: 10,
        enableSummaryWrites: true,
      };

      const env = {
        CHECK_INTERVAL_MINUTES: "5",
        ENABLE_SUMMARY_WRITES: "false",
      };

      const manager = ConfigManager.create(storage, env, config);

      expect(manager.getCheckIntervalMinutes()).toBe(5);
      expect(manager.getEnableSummaryWrites()).toBe(false);
    });

    it("should fall back when numeric env vars are invalid", () => {
      const config = {
        sites: [{ url: "https://example.com" }],
        checkIntervalMinutes: 10,
      };

      const manager = ConfigManager.create(storage, { CHECK_INTERVAL_MINUTES: "nope" }, config);

      expect(manager.getCheckIntervalMinutes()).toBe(10);
    });

    it("should fall back when boolean env vars are invalid", () => {
      const config = {
        sites: [{ url: "https://example.com" }],
        enableSummaryWrites: true,
      };

      const manager = ConfigManager.create(storage, { ENABLE_SUMMARY_WRITES: "maybe" }, config);

      expect(manager.getEnableSummaryWrites()).toBe(true);
    });
  });

  describe("getSites", () => {
    it("should return sites from storage when available", async () => {
      const storedSites = [{ url: "https://stored.com", timeout: 5000 }];

      await storage.put("config:sites", JSON.stringify(storedSites));

      const config = {
        sites: [{ url: "https://config.com" }],
      };

      const manager = ConfigManager.create(storage, {}, config);
      const sites = await manager.getSites();

      expect(sites).toEqual([
        {
          url: "https://stored.com",
          name: "stored.com",
          timeout: 5000,
          method: "GET",
          headers: {},
          paused: false,
          retries: 0,
          retryDelayMs: 1000,
        },
      ]);
    });

    it("should return config sites when storage is empty", async () => {
      const config = {
        sites: [{ url: "https://config.com", timeout: 10000 }],
      };

      const manager = ConfigManager.create(storage, {}, config);
      const sites = await manager.getSites();

      expect(sites).toEqual([
        {
          url: "https://config.com",
          name: "config.com",
          timeout: 10000,
          method: "GET",
          headers: {},
          paused: false,
          retries: 0,
          retryDelayMs: 1000,
        },
      ]);
    });

    it("should return empty array when no sites exist", async () => {
      const manager = ConfigManager.create(storage, {});
      const sites = await manager.getSites();

      expect(sites).toEqual([]);
    });
  });

  describe("setSites", () => {
    it("should store sites in storage", async () => {
      const config = {
        sites: [{ url: "https://example.com" }],
      };

      const manager = ConfigManager.create(storage, {}, config);
      const newSites = [
        { url: "https://new1.com", timeout: 5000 },
        { url: "https://new2.com", timeout: 8000 },
      ];

      await manager.setSites(newSites);

      const retrieved = await storage.get("config:sites", "json");
      expect(retrieved).toEqual([
        {
          url: "https://new1.com",
          name: "new1.com",
          timeout: 5000,
          method: "GET",
          headers: {},
          paused: false,
          retries: 0,
          retryDelayMs: 1000,
        },
        {
          url: "https://new2.com",
          name: "new2.com",
          timeout: 8000,
          method: "GET",
          headers: {},
          paused: false,
          retries: 0,
          retryDelayMs: 1000,
        },
      ]);
    });
  });

  describe("alert configuration", () => {
    it("should return default values when no alerts configured", () => {
      const config = {
        sites: [{ url: "https://example.com" }],
      };

      const manager = ConfigManager.create(storage, {}, config);

      expect(manager.hasAlerts()).toBe(false);
      expect(manager.getAlertThreshold()).toBe(3);
      expect(manager.getAlertFromEmail()).toBe("alerts@yourdomain.com");
      expect(manager.getAlertFromName()).toBe("MikroAPM");
      expect(manager.getAlertToEmail()).toBeUndefined();
    });

    it("should retrieve BREVO_API_KEY from env", () => {
      const config = {
        sites: [{ url: "https://example.com" }],
      };

      const env = { BREVO_API_KEY: "test-key-123" };
      const manager = ConfigManager.create(storage, env, config);

      expect(manager.getBrevoApiKey()).toBe("test-key-123");
    });

    it("should retrieve admin and webhook configuration", () => {
      const manager = ConfigManager.create(
        storage,
        {
          MIKROAPM_ADMIN_TOKEN: "admin-secret",
          WEBHOOK_URL: "https://hooks.example.com/apm",
          WEBHOOK_SECRET: "hook-secret",
        },
        { sites: [{ url: "https://example.com" }] },
      );

      expect(manager.getAdminToken()).toBe("admin-secret");
      expect(manager.getWebhookUrl()).toBe("https://hooks.example.com/apm");
      expect(manager.getWebhookSecret()).toBe("hook-secret");
    });
  });
});
