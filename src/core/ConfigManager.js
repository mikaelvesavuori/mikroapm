import { MikroValid } from "mikrovalid";
import { validateSites } from "./SiteValidator.js";

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
      webhookUrl: { type: "string" },
      webhookSecret: { type: "string" },
    },
    admin: {
      type: "object",
      token: { type: "string" },
    },
    public: {
      type: "object",
      password: { type: "string" },
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

      try {
        configFile = {
          ...configFile,
          sites: validateSites(configFile.sites),
        };
      } catch (error) {
        throw new Error(`Invalid config: ${error.message}`);
      }
    }

    // Build unified config with precedence
    const config = {
      sites: configFile.sites || [],
      checkIntervalMinutes: ConfigManager._resolveNumber(
        env.CHECK_INTERVAL_MINUTES,
        configFile.checkIntervalMinutes,
        1,
      ),
      enableSummaryWrites: ConfigManager._resolveBoolean(
        env.ENABLE_SUMMARY_WRITES,
        configFile.enableSummaryWrites,
        true,
      ),
      alerts: ConfigManager._resolveAlerts(env, configFile.alerts),
      adminToken: env.MIKROAPM_ADMIN_TOKEN || env.ADMIN_TOKEN || configFile.admin?.token,
      publicPassword:
        env.MIKROAPM_PUBLIC_PASSWORD || env.PUBLIC_PASSWORD || configFile.public?.password,
    };

    return new ConfigManager(storage, config, env);
  }

  /**
   * Resolve alert configuration with precedence: env vars > config file > defaults
   */
  static _resolveAlerts(env, fileAlerts) {
    const envWebhookUrl = env.WEBHOOK_URL || env.NOTIFICATION_WEBHOOK_URL;
    const envWebhookSecret = env.WEBHOOK_SECRET || env.NOTIFICATION_WEBHOOK_SECRET;
    const hasEnvAlerts = env.ALERT_FROM_EMAIL || env.ALERT_TO_EMAIL || envWebhookUrl;
    const hasFileAlerts =
      fileAlerts && (fileAlerts.fromEmail || fileAlerts.toEmail || fileAlerts.webhookUrl);

    if (!hasEnvAlerts && !hasFileAlerts) return undefined;

    return {
      threshold: ConfigManager._resolveNumber(env.ALERT_THRESHOLD, fileAlerts?.threshold, 3),
      fromEmail: env.ALERT_FROM_EMAIL || fileAlerts?.fromEmail || "alerts@yourdomain.com",
      fromName: env.ALERT_FROM_NAME || fileAlerts?.fromName || "MikroAPM",
      toEmail: env.ALERT_TO_EMAIL || fileAlerts?.toEmail,
      webhookUrl: envWebhookUrl || fileAlerts?.webhookUrl,
      webhookSecret: envWebhookSecret || fileAlerts?.webhookSecret,
    };
  }

  /**
   * Resolve numeric value with precedence
   */
  static _resolveNumber(envValue, fileValue, defaultValue) {
    if (envValue !== undefined) {
      const parsed = parseInt(envValue, 10);
      return Number.isNaN(parsed) ? (fileValue ?? defaultValue) : parsed;
    }
    return fileValue !== undefined ? fileValue : defaultValue;
  }

  /**
   * Resolve boolean value with precedence
   */
  static _resolveBoolean(envValue, fileValue, defaultValue) {
    if (envValue !== undefined) {
      if (envValue === "true" || envValue === true) return true;
      if (envValue === "false" || envValue === false) return false;
      return fileValue ?? defaultValue;
    }
    return fileValue !== undefined ? fileValue : defaultValue;
  }

  async getSites() {
    const stored = await this.storage.get("config:sites", "json");
    if (stored) return validateSites(stored, { allowEmpty: true });

    if (this.config.sites.length > 0) return this.config.sites;

    return [];
  }

  async setSites(sites) {
    const validatedSites = validateSites(sites);
    await this.storage.put("config:sites", JSON.stringify(validatedSites));
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

  getAdminToken() {
    return this.config.adminToken;
  }

  getPublicPassword() {
    return this.config.publicPassword;
  }

  getWebhookUrl() {
    return this.config.alerts?.webhookUrl;
  }

  getWebhookSecret() {
    return this.config.alerts?.webhookSecret;
  }

  getCheckIntervalMinutes() {
    return this.config.checkIntervalMinutes || 1;
  }

  getEnableSummaryWrites() {
    return this.config.enableSummaryWrites !== false;
  }
}
