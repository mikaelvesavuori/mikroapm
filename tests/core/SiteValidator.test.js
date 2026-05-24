import { describe, expect, it } from "vitest";
import { getSuppression, ValidationError, validateSites } from "../../src/core/SiteValidator.js";

describe("SiteValidator", () => {
  it("should normalize supported check options", () => {
    const sites = validateSites([
      {
        name: "API",
        url: "https://example.com/health",
        method: "post",
        headers: { "x-test": 1 },
        body: "{}",
        timeout: 5000,
        expectedStatus: 202,
        expectedText: "ok",
        maxLatencyMs: 1000,
        retries: 2,
        retryDelayMs: 50,
      },
    ]);

    expect(sites[0]).toEqual({
      name: "API",
      url: "https://example.com/health",
      method: "POST",
      headers: { "x-test": "1" },
      body: "{}",
      timeout: 5000,
      expectedStatuses: [202],
      expectedText: "ok",
      maxLatencyMs: 1000,
      paused: false,
      retries: 2,
      retryDelayMs: 50,
    });
  });

  it("should reject localhost and private network targets", () => {
    expect(() => validateSites([{ url: "http://localhost:3000" }])).toThrow(ValidationError);
    expect(() => validateSites([{ url: "http://192.168.0.10" }])).toThrow(ValidationError);
  });

  it("should allow private targets when explicitly enabled", () => {
    const [site] = validateSites([{ url: "http://127.0.0.1:3000", allowPrivateNetwork: true }]);

    expect(site.allowPrivateNetwork).toBe(true);
  });

  it("should default missing names to the protocol-less URL", () => {
    const [site] = validateSites([{ url: "https://example.com/health" }]);

    expect(site.name).toBe("example.com/health");
  });

  it("should detect active maintenance windows", () => {
    const [site] = validateSites([
      {
        url: "https://example.com",
        maintenanceWindows: [
          {
            start: "2026-01-01T00:00:00.000Z",
            end: "2026-01-01T01:00:00.000Z",
            reason: "Deploy",
          },
        ],
      },
    ]);

    expect(getSuppression(site, Date.parse("2026-01-01T00:30:00.000Z"))).toMatchObject({
      status: "maintenance",
      message: "Deploy",
    });
  });
});
