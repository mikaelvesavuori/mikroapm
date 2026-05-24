const CONFIG_ENV_KEYS = [
  "BREVO_API_KEY",
  "CHECK_INTERVAL_MINUTES",
  "ENABLE_SUMMARY_WRITES",
  "ALERT_THRESHOLD",
  "ALERT_FROM_EMAIL",
  "ALERT_FROM_NAME",
  "ALERT_TO_EMAIL",
  "MIKROAPM_ADMIN_TOKEN",
  "ADMIN_TOKEN",
  "MIKROAPM_PUBLIC_PASSWORD",
  "PUBLIC_PASSWORD",
  "WEBHOOK_URL",
  "WEBHOOK_SECRET",
  "NOTIFICATION_WEBHOOK_URL",
  "NOTIFICATION_WEBHOOK_SECRET",
];

export function collectConfigEnv(source = {}) {
  const env = {};

  for (const key of CONFIG_ENV_KEYS) {
    if (source[key] !== undefined) {
      env[key] = source[key];
    }
  }

  return env;
}

export function readServerOptions(source = {}) {
  return {
    port: parseInteger(source.MIKROAPM_PORT ?? source.PORT, 3000),
    configPath: source.MIKROAPM_CONFIG_PATH || source.CONFIG_PATH || "./mikroapm.config.json",
    dbPath: source.MIKROAPM_DB_PATH || source.DB_PATH || "./data/mikroapm",
    enableScheduler: source.ENABLE_SCHEDULER !== "false",
    env: collectConfigEnv(source),
  };
}

function parseInteger(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}
