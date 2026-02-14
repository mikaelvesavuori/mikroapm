import { startServer } from '../../src/adapters/hono-server/index.js';

startServer({
  port: process.env.PORT || 3000,
  configPath: './mikroapm.config.json',
  dbPath: './data/mikroapm',
  env: { BREVO_API_KEY: process.env.BREVO_API_KEY }
});
