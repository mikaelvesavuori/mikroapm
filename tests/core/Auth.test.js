import { describe, expect, it } from "vitest";
import {
  createAuthRateLimiter,
  getAdminAuthResult,
  getPublicAuthResult,
} from "../../src/core/Auth.js";

describe("Auth", () => {
  it("should disable admin access when no token is configured", () => {
    const request = new Request("https://example.com/api/sites");
    const result = getAdminAuthResult(request);

    expect(result).toMatchObject({ ok: false, status: 503 });
  });

  it("should authorize bearer tokens", () => {
    const request = new Request("https://example.com/api/sites", {
      headers: { Authorization: "Bearer secret" },
    });

    expect(getAdminAuthResult(request, "secret")).toEqual({ ok: true });
  });

  it("should reject invalid tokens", () => {
    const request = new Request("https://example.com/api/sites", {
      headers: { "x-mikroapm-admin-token": "wrong" },
    });

    expect(getAdminAuthResult(request, "secret")).toMatchObject({
      ok: false,
      status: 401,
      error: "Invalid admin password.",
    });
  });

  it("should rate limit repeated invalid admin attempts", () => {
    const request = new Request("https://example.com/api/sites", {
      headers: { Authorization: "Bearer wrong" },
    });
    const rateLimiter = createAuthRateLimiter({
      maxAttempts: 2,
      windowMs: 60000,
      lockoutMs: 300000,
    });
    const options = { rateLimiter, rateLimitKey: "test-client" };

    expect(getAdminAuthResult(request, "secret", options)).toMatchObject({
      ok: false,
      status: 401,
    });
    expect(getAdminAuthResult(request, "secret", options)).toMatchObject({
      ok: false,
      status: 429,
    });
    expect(
      getAdminAuthResult(
        new Request("https://example.com/api/sites", {
          headers: { Authorization: "Bearer secret" },
        }),
        "secret",
        options,
      ),
    ).toMatchObject({ ok: false, status: 429 });
  });

  it("should allow public access by default and require configured public passwords", () => {
    const openRequest = new Request("https://example.com/api/status");
    expect(getPublicAuthResult(openRequest)).toEqual({ ok: true });

    const lockedRequest = new Request("https://example.com/api/status");
    expect(getPublicAuthResult(lockedRequest, "public-secret")).toMatchObject({
      ok: false,
      status: 401,
    });

    const authorizedRequest = new Request("https://example.com/api/status", {
      headers: { "x-mikroapm-public-password": "public-secret" },
    });
    expect(getPublicAuthResult(authorizedRequest, "public-secret")).toEqual({ ok: true });
  });
});
