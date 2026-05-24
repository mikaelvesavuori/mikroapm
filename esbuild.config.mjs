import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";

import { build } from "esbuild";

const target = readCliTarget();
const distDir = "dist";

const sharedConfig = {
  bundle: true,
  format: "esm",
  minify: true,
  sourcemap: false,
};

const buildTargets = {
  server: {
    ...sharedConfig,
    banner: {
      js: "#!/usr/bin/env node",
    },
    entryPoints: ["src/server.js"],
    outfile: "dist/server.js",
    platform: "node",
    target: "node25",
  },
  workers: {
    ...sharedConfig,
    conditions: ["workerd"],
    entryPoints: ["src/adapters/cf-workers/index.js"],
    outfile: "dist/workers.js",
    platform: "neutral",
  },
};

function readCliTarget() {
  const targetIndex = process.argv.indexOf("--target");
  if (targetIndex >= 0 && process.argv[targetIndex + 1]) {
    return process.argv[targetIndex + 1];
  }

  return "all";
}

function prepareDist() {
  rmSync(distDir, { force: true, recursive: true });
  preparePublicAssets();
}

function preparePublicAssets() {
  rmSync("dist/public", { force: true, recursive: true });

  if (existsSync("src/public")) {
    mkdirSync("dist/public", { recursive: true });
    cpSync("src/public", "dist/public", { recursive: true });
  }
}

async function buildTarget(name) {
  const config = buildTargets[name];
  if (!config) {
    throw new Error(`Unknown build target '${name}'. Use 'server', 'workers', or omit --target.`);
  }

  await build(config);
  console.log(`Built ${name} -> ${config.outfile}`);
}

if (target === "all") {
  prepareDist();
  for (const name of Object.keys(buildTargets)) {
    await buildTarget(name);
  }
} else {
  if (!buildTargets[target]) {
    throw new Error(`Unknown build target '${target}'. Use 'server', 'workers', or omit --target.`);
  }

  mkdirSync(distDir, { recursive: true });
  preparePublicAssets();
  rmSync(buildTargets[target].outfile, { force: true });
  await buildTarget(target);
}
