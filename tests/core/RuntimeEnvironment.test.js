import { describe, expect, it } from "vitest";
import { collectConfigEnv, readServerOptions } from "../../src/core/RuntimeEnvironment.js";

describe("RuntimeEnvironment", () => {
  describe("collectConfigEnv", () => {
    it("should collect only supported config environment keys", () => {
      const env = collectConfigEnv({
        BREVO_API_KEY: "brevo-key",
        CHECK_INTERVAL_MINUTES: "5",
        ENABLE_SUMMARY_WRITES: "false",
        ALERT_THRESHOLD: "2",
        ALERT_FROM_EMAIL: "alerts@example.com",
        ALERT_FROM_NAME: "MikroAPM",
        ALERT_TO_EMAIL: "owner@example.com",
        MIKROAPM_PORT: "9998",
        PORT: "9999",
      });

      expect(env).toEqual({
        BREVO_API_KEY: "brevo-key",
        CHECK_INTERVAL_MINUTES: "5",
        ENABLE_SUMMARY_WRITES: "false",
        ALERT_THRESHOLD: "2",
        ALERT_FROM_EMAIL: "alerts@example.com",
        ALERT_FROM_NAME: "MikroAPM",
        ALERT_TO_EMAIL: "owner@example.com",
      });
    });
  });

  describe("readServerOptions", () => {
    it("should read server runtime options from an env-like object", () => {
      const options = readServerOptions({
        MIKROAPM_PORT: "4000",
        MIKROAPM_CONFIG_PATH: "./custom.config.json",
        MIKROAPM_DB_PATH: "./custom-data",
        ENABLE_SCHEDULER: "false",
        CHECK_INTERVAL_MINUTES: "10",
      });

      expect(options).toEqual({
        port: 4000,
        configPath: "./custom.config.json",
        dbPath: "./custom-data",
        enableScheduler: false,
        env: {
          CHECK_INTERVAL_MINUTES: "10",
        },
      });
    });

    it("should use generic runtime aliases when product-specific values are absent", () => {
      const options = readServerOptions({
        PORT: "4001",
        CONFIG_PATH: "./generic.config.json",
        DB_PATH: "./generic-data",
      });

      expect(options).toEqual({
        port: 4001,
        configPath: "./generic.config.json",
        dbPath: "./generic-data",
        enableScheduler: true,
        env: {},
      });
    });

    it("should fall back to defaults for invalid or missing values", () => {
      const options = readServerOptions({ MIKROAPM_PORT: "not-a-number" });

      expect(options).toEqual({
        port: 3000,
        configPath: "./mikroapm.config.json",
        dbPath: "./data/mikroapm",
        enableScheduler: true,
        env: {},
      });
    });
  });
});
