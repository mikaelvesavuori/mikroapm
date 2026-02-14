import { startServer } from './adapters/hono-server/index.js';

// Start the server with configuration from environment variables or defaults
startServer({
  port: parseInt(process.env.PORT || '3000', 10),
  configPath: process.env.CONFIG_PATH || './mikroapm.config.json',
  dbPath: process.env.DB_PATH || './data/mikroapm',
  env: {
    BREVO_API_KEY: process.env.BREVO_API_KEY
  }
});
