import { startServer } from "./adapters/hono-server/index.js";
import { readServerOptions } from "./core/RuntimeEnvironment.js";

startServer(readServerOptions(process.env));
