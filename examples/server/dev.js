import { startServer } from "../../src/adapters/hono-server/index.js";
import { readServerOptions } from "../../src/core/RuntimeEnvironment.js";

startServer(readServerOptions(process.env));
