#!/usr/bin/env node

import { build } from "esbuild";

const target = process.argv[2];

const shared = {
  bundle: true,
  minify: true,
  format: "esm",
  sourcemap: false,
};

const configs = {
  workers: {
    ...shared,
    entryPoints: ["src/adapters/cf-workers/index.js"],
    outfile: "dist/workers.js",
    platform: "neutral",
    conditions: ["workerd"],
  },
  server: {
    ...shared,
    entryPoints: ["src/server.js"],
    outfile: "dist/server.js",
    platform: "node",
    target: "node24",
    banner: {
      js: "#!/usr/bin/env node"
    }
  },
};

if (target && configs[target]) {
  await build(configs[target]);
  console.log(`Built ${target} → dist/${target}.js`);
} else if (!target) {
  for (const [name, config] of Object.entries(configs)) {
    await build(config);
    console.log(`Built ${name} → dist/${name}.js`);
  }
} else {
  console.error(`Unknown target: ${target}. Use "workers" or "server".`);
  process.exit(1);
}
