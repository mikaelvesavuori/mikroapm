import { MikroValid } from "mikrovalid";

const configSchema = {
  properties: {
    sites: {
      type: "array",
      items: { type: "object" },
      minLength: 1,
    },
    checkIntervalMinutes: {
      type: "number",
      minValue: 1,
    },
    enableSummaryWrites: {
      type: "boolean",
    },
    alerts: {
      type: "object",
      threshold: { type: "number", minValue: 1 },
      fromEmail: { type: "string", format: "email" },
      fromName: { type: "string" },
      toEmail: { type: "string", format: "email" },
    },
    required: ["sites"],
  },
};

/**
 * Configuration manager for MikroAPM.
 *
 * Unified configuration with precedence: env vars > config file > defaults
 *
 * Usage: `ConfigManager.create(storage, env, configFile)`
 * - Server: pass parsed config file
 * - Workers: pass empty object for configFile
 */
export class ConfigManager {
  constructor(storage, config, env = {}) {
    this.storage = storage;
    this.config = config;
    this.env = env;
  }

  /**
   * Create a ConfigManager with unified configuration handling.
   * Precedence: environment variables > config file > defaults
   *
   * @param {Object} storage - Storage adapter instance
   * @param {Object} env - Environment variables
   * @param {Object} configFile - Parsed config file (optional, for server adapter)
   */
  static create(storage, env = {}, configFile = {}) {
    // Validate config file if provided
    if (configFile.sites) {
      const validator = new MikroValid();
      const { success, errors } = validator.test(configSchema, configFile);

      if (!success) {
        const messages = errors.map((e) => `${e.key}: ${e.error}`).join(", ");
        throw new Error(`Invalid config: ${messages}`);
      }

      for (let i = 0; i < configFile.sites.length; i++) {
        const site = configFile.sites[i];
        if (!site.url || typeof site.url !== "string") {
          throw new Error(`Invalid config: sites[${i}].url is required and must be a string`);
        }
      }
    }

    // Build unified config with precedence
    const config = {
      sites: configFile.sites || [],
      checkIntervalMinutes: ConfigManager._resolveNumber(
        env.CHECK_INTERVAL_MINUTES,
        configFile.checkIntervalMinutes,
        1
      ),
      enableSummaryWrites: ConfigManager._resolveBoolean(
        env.ENABLE_SUMMARY_WRITES,
        configFile.enableSummaryWrites,
        true
      ),
      alerts: ConfigManager._resolveAlerts(env, configFile.alerts),
    };

    return new ConfigManager(storage, config, env);
  }

  /**
   * Resolve alert configuration with precedence: env vars > config file > defaults
   */
  static _resolveAlerts(env, fileAlerts) {
    const hasEnvAlerts = env.ALERT_FROM_EMAIL || env.ALERT_TO_EMAIL;
    const hasFileAlerts = fileAlerts && (fileAlerts.fromEmail || fileAlerts.toEmail);

    if (!hasEnvAlerts && !hasFileAlerts) return undefined;

    return {
      threshold: ConfigManager._resolveNumber(env.ALERT_THRESHOLD, fileAlerts?.threshold, 3),
      fromEmail: env.ALERT_FROM_EMAIL || fileAlerts?.fromEmail || "alerts@yourdomain.com",
      fromName: env.ALERT_FROM_NAME || fileAlerts?.fromName || "MikroAPM",
      toEmail: env.ALERT_TO_EMAIL || fileAlerts?.toEmail,
    };
  }

  /**
   * Resolve numeric value with precedence
   */
  static _resolveNumber(envValue, fileValue, defaultValue) {
    if (envValue !== undefined) {
      const parsed = parseInt(envValue, 10);
      return Number.isNaN(parsed) ? defaultValue : parsed;
    }
    return fileValue !== undefined ? fileValue : defaultValue;
  }

  /**
   * Resolve boolean value with precedence
   */
  static _resolveBoolean(envValue, fileValue, defaultValue) {
    if (envValue !== undefined) {
      return envValue === "true" || envValue === true;
    }
    return fileValue !== undefined ? fileValue : defaultValue;
  }

  async getSites() {
    const stored = await this.storage.get("config:sites", "json");
    if (stored) return stored;

    if (this.config.sites.length > 0) return this.config.sites;

    return [];
  }

  async setSites(sites) {
    await this.storage.put("config:sites", JSON.stringify(sites));
  }

  hasAlerts() {
    return !!this.config.alerts;
  }

  getAlertThreshold() {
    return this.config.alerts?.threshold ?? 3;
  }

  getAlertFromEmail() {
    return this.config.alerts?.fromEmail ?? "alerts@yourdomain.com";
  }

  getAlertFromName() {
    return this.config.alerts?.fromName ?? "MikroAPM";
  }

  getAlertToEmail() {
    return this.config.alerts?.toEmail;
  }

  getBrevoApiKey() {
    return this.env.BREVO_API_KEY;
  }

  getCheckIntervalMinutes() {
    // Priority: env var > config file > default
    if (this.env.CHECK_INTERVAL_MINUTES) {
      return parseInt(this.env.CHECK_INTERVAL_MINUTES, 10);
    }
    return this.config.checkIntervalMinutes || 1;
  }

  getEnableSummaryWrites() {
    // Priority: env var > config file > default (true)
    if (this.env.ENABLE_SUMMARY_WRITES !== undefined) {
      return this.env.ENABLE_SUMMARY_WRITES === "true" || this.env.ENABLE_SUMMARY_WRITES === true;
    }
    return this.config.enableSummaryWrites !== false;
  }
}
