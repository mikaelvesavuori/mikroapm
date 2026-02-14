import { startServer } from '../../src/adapters/hono-server/index.js';

startServer({
  port: parseInt(process.env.PORT || '3000'),
  configPath: process.env.CONFIG_PATH || './mikroapm.config.json',
  dbPath: process.env.DB_PATH || './data/mikroapm',
  env: {
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    CHECK_INTERVAL_MINUTES: process.env.CHECK_INTERVAL_MINUTES || '1'
  },
  enableScheduler: process.env.ENABLE_SCHEDULER !== 'false'
});
