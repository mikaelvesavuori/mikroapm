export function getOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "MikroAPM API",
      version: "1.1.0",
      description: "Public status and protected administration API for MikroAPM.",
    },
    paths: {
      "/api/status": {
        get: {
          summary: "List public status for monitored sites",
          responses: {
            200: { description: "Status list" },
            401: { description: "Public status password required when configured" },
            429: { description: "Too many unlock attempts" },
          },
        },
      },
      "/api/status/{domain}": {
        get: {
          summary: "Get current public status for a domain",
          parameters: [{ name: "domain", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Current status" },
            401: { description: "Public status password required when configured" },
            404: { description: "Domain is not configured for monitoring" },
            429: { description: "Too many unlock attempts" },
          },
        },
      },
      "/api/uptime/{domain}": {
        get: {
          summary: "Get uptime summaries for a domain",
          parameters: [
            { name: "domain", in: "path", required: true, schema: { type: "string" } },
            {
              name: "days",
              in: "query",
              required: false,
              schema: { type: "integer", default: 30 },
            },
          ],
          responses: {
            200: { description: "Uptime data" },
            401: { description: "Public status password required when configured" },
            404: { description: "Domain is not configured for monitoring" },
            429: { description: "Too many unlock attempts" },
          },
        },
      },
      "/api/failures/{domain}/{date}": {
        get: {
          summary: "Get failure details for a domain and UTC date",
          parameters: [
            { name: "domain", in: "path", required: true, schema: { type: "string" } },
            { name: "date", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Failure list" },
            401: { description: "Public status password required when configured" },
            404: { description: "Domain is not configured for monitoring" },
            429: { description: "Too many unlock attempts" },
          },
        },
      },
      "/api/sites": {
        get: {
          summary: "List full site configuration",
          security: [{ adminToken: [] }],
          responses: {
            200: { description: "Site configuration" },
            401: { description: "Unauthorized" },
            429: { description: "Too many sign-in attempts" },
          },
        },
        post: {
          summary: "Replace full site configuration",
          security: [{ adminToken: [] }],
          responses: {
            200: { description: "Sites saved" },
            400: { description: "Invalid sites" },
            401: { description: "Unauthorized" },
            429: { description: "Too many sign-in attempts" },
          },
        },
      },
      "/api/check": {
        post: {
          summary: "Run checks immediately",
          security: [{ adminToken: [] }],
          responses: {
            200: { description: "Checks completed" },
            401: { description: "Unauthorized" },
            429: { description: "Too many sign-in attempts" },
          },
        },
      },
      "/api/cleanup": {
        post: {
          summary: "Remove expired records",
          security: [{ adminToken: [] }],
          responses: {
            200: { description: "Cleanup completed" },
            401: { description: "Unauthorized" },
            429: { description: "Too many sign-in attempts" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        adminToken: {
          type: "http",
          scheme: "bearer",
          description: "Set this to the configured admin password / MIKROAPM_ADMIN_TOKEN.",
        },
        publicPassword: {
          type: "apiKey",
          in: "header",
          name: "x-mikroapm-public-password",
          description: "Only required when public status password protection is configured.",
        },
      },
    },
  };
}
