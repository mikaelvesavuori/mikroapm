import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHonoApp } from "../../src/adapters/hono-server/index.js";
import { cleanupTestDb, createTestDb } from "../helpers/testUtils.js";

describe("Hono server adapter", () => {
  let storage;
  let configPath;

  beforeEach(() => {
    storage = createTestDb("hono-server");
    mkdirSync("tests/tmp", { recursive: true });
    configPath = `tests/tmp/mikroapm-${Date.now()}.json`;
    writeFileSync(
      configPath,
      JSON.stringify({
        sites: [{ url: "https://example.com" }],
      }),
    );
  });

  afterEach(() => {
    cleanupTestDb(storage);
    if (configPath) {
      rmSync(configPath, { force: true });
    }
  });

  it("should require admin auth for site configuration", async () => {
    const app = createHonoApp({
      configPath,
      storage,
      env: { MIKROAPM_ADMIN_TOKEN: "secret" },
    });

    const unauthorized = await app.fetch(new Request("http://localhost/api/sites"));
    expect(unauthorized.status).toBe(401);

    const authorized = await app.fetch(
      new Request("http://localhost/api/sites", {
        headers: { Authorization: "Bearer secret" },
      }),
    );
    expect(authorized.status).toBe(200);
  });

  it("should reject invalid site updates before storage", async () => {
    const app = createHonoApp({
      configPath,
      storage,
      env: { MIKROAPM_ADMIN_TOKEN: "secret" },
    });

    const response = await app.fetch(
      new Request("http://localhost/api/sites", {
        method: "POST",
        headers: {
          Authorization: "Bearer secret",
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ url: "http://localhost:3000" }]),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Invalid sites");
  });

  it("should expose public status without admin auth", async () => {
    const app = createHonoApp({
      configPath,
      storage,
      env: { MIKROAPM_ADMIN_TOKEN: "secret" },
    });

    const response = await app.fetch(new Request("http://localhost/api/status"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sites[0]).toMatchObject({
      domain: "example.com",
      url: "https://example.com",
    });
  });

  it("should protect public status when a public password is configured", async () => {
    writeFileSync(
      configPath,
      JSON.stringify({
        sites: [{ url: "https://example.com" }],
        public: { password: "public-secret" },
      }),
    );
    const app = createHonoApp({
      configPath,
      storage,
      env: { MIKROAPM_ADMIN_TOKEN: "secret" },
    });

    const locked = await app.fetch(new Request("http://localhost/api/status"));
    expect(locked.status).toBe(401);

    const unlocked = await app.fetch(
      new Request("http://localhost/api/status", {
        headers: { "x-mikroapm-public-password": "public-secret" },
      }),
    );
    expect(unlocked.status).toBe(200);
  });

  it("should only expose uptime for configured public sites", async () => {
    const app = createHonoApp({
      configPath,
      storage,
      env: { MIKROAPM_ADMIN_TOKEN: "secret" },
    });

    const configured = await app.fetch(new Request("http://localhost/api/uptime/example.com"));
    expect(configured.status).toBe(200);

    const unknown = await app.fetch(new Request("http://localhost/api/uptime/not-configured.test"));
    expect(unknown.status).toBe(404);
    await expect(unknown.json()).resolves.toMatchObject({
      code: "SITE_NOT_CONFIGURED",
    });
  });

  it("should serve app icon and manifest assets", async () => {
    const app = createHonoApp({
      configPath,
      storage,
      env: { MIKROAPM_ADMIN_TOKEN: "secret" },
    });

    const manifest = await app.fetch(new Request("http://localhost/manifest.webmanifest"));
    expect(manifest.status).toBe(200);
    expect(manifest.headers.get("Content-Type")).toContain("application/manifest+json");

    const favicon = await app.fetch(new Request("http://localhost/favicon.svg"));
    expect(favicon.status).toBe(200);
    expect(favicon.headers.get("Content-Type")).toContain("image/svg+xml");
  });
});
