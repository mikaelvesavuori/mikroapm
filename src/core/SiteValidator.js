const ALLOWED_METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"];
const DEFAULT_TIMEOUT = 10000;
const MIN_TIMEOUT = 100;
const MAX_TIMEOUT = 120000;
const MAX_RETRIES = 5;
const MAX_RETRY_DELAY = 60000;
const MAX_LATENCY = 300000;

export class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

export function validateSites(input, options = {}) {
  const { allowEmpty = false } = options;
  const errors = [];

  if (!Array.isArray(input)) {
    throw new ValidationError("Invalid sites: expected an array", ["sites must be an array"]);
  }

  if (!allowEmpty && input.length === 0) {
    throw new ValidationError("Invalid sites: at least one site is required", [
      "sites must contain at least one entry",
    ]);
  }

  const sites = input.map((site, index) => validateSite(site, index, errors));

  if (errors.length > 0) {
    throw new ValidationError(`Invalid sites: ${errors.join(", ")}`, errors);
  }

  return sites;
}

export function validateSite(input, index = 0, sharedErrors = null) {
  const errors = sharedErrors || [];
  const path = `sites[${index}]`;

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    errors.push(`${path} must be an object`);
    return {};
  }

  const url = normalizeUrl(input.url, path, errors, input.allowPrivateNetwork === true);
  const site = {
    url,
    timeout: normalizeInteger(input.timeout, DEFAULT_TIMEOUT, {
      path: `${path}.timeout`,
      min: MIN_TIMEOUT,
      max: MAX_TIMEOUT,
      errors,
    }),
    method: normalizeMethod(input.method, `${path}.method`, errors),
    headers: normalizeHeaders(input.headers, `${path}.headers`, errors),
    paused: input.paused === true,
  };

  site.name =
    typeof input.name === "string" && input.name.trim()
      ? input.name.trim().slice(0, 120)
      : getDefaultSiteName(site.url);

  if (typeof input.alertEmail === "string" && input.alertEmail.trim()) {
    const alertEmail = input.alertEmail.trim();
    if (!isEmail(alertEmail)) {
      errors.push(`${path}.alertEmail must be an email address`);
    } else {
      site.alertEmail = alertEmail;
    }
  }

  if (input.allowPrivateNetwork === true) {
    site.allowPrivateNetwork = true;
  }

  const expectedStatuses = normalizeExpectedStatuses(input, path, errors);
  if (expectedStatuses) {
    site.expectedStatuses = expectedStatuses;
  }

  if (typeof input.body === "string" && input.body.length > 0) {
    if (site.method === "GET" || site.method === "HEAD") {
      errors.push(`${path}.body is only supported for methods with request bodies`);
    } else {
      site.body = input.body;
    }
  }

  if (typeof input.expectedText === "string" && input.expectedText.length > 0) {
    site.expectedText = input.expectedText;
  }

  if (typeof input.expectedRegex === "string" && input.expectedRegex.length > 0) {
    try {
      new RegExp(input.expectedRegex);
      site.expectedRegex = input.expectedRegex;
    } catch {
      errors.push(`${path}.expectedRegex must be a valid regular expression`);
    }
  }

  if (input.maxLatencyMs !== undefined) {
    site.maxLatencyMs = normalizeInteger(input.maxLatencyMs, undefined, {
      path: `${path}.maxLatencyMs`,
      min: 1,
      max: MAX_LATENCY,
      errors,
    });
  }

  site.retries = normalizeInteger(input.retries, 0, {
    path: `${path}.retries`,
    min: 0,
    max: MAX_RETRIES,
    errors,
  });

  site.retryDelayMs = normalizeInteger(input.retryDelayMs, 1000, {
    path: `${path}.retryDelayMs`,
    min: 0,
    max: MAX_RETRY_DELAY,
    errors,
  });

  const maintenanceWindows = normalizeMaintenanceWindows(
    input.maintenanceWindows,
    `${path}.maintenanceWindows`,
    errors,
  );
  if (maintenanceWindows.length > 0) {
    site.maintenanceWindows = maintenanceWindows;
  }

  return site;
}

export function getSiteDomain(site) {
  return new URL(site.url).hostname;
}

export function getDefaultSiteName(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}`.slice(0, 120);
  } catch {
    return String(url || "Monitored site")
      .replace(/^https?:\/\//, "")
      .slice(0, 120);
  }
}

export function getSiteTimeout(site) {
  return typeof site.timeout === "number" && Number.isFinite(site.timeout) && site.timeout > 0
    ? site.timeout
    : DEFAULT_TIMEOUT;
}

export function getSuppression(site, now = Date.now()) {
  if (site.paused) {
    return {
      status: "paused",
      message: "Monitoring is paused",
    };
  }

  const activeWindow = (site.maintenanceWindows || []).find((window) => {
    const start = Date.parse(window.start);
    const end = Date.parse(window.end);
    return now >= start && now <= end;
  });

  if (!activeWindow) return null;

  return {
    status: "maintenance",
    message: activeWindow.reason || "Maintenance window is active",
    maintenanceWindow: activeWindow,
  };
}

export function toPublicSite(site) {
  const domain = getSiteDomain(site);
  return {
    name: site.name || getDefaultSiteName(site.url),
    url: site.url,
    domain,
    method: site.method || "GET",
    paused: site.paused === true,
    maintenanceWindows: site.maintenanceWindows || [],
  };
}

function normalizeUrl(value, path, errors, allowPrivateNetwork = false) {
  if (!value || typeof value !== "string") {
    errors.push(`${path}.url is required and must be a string`);
    return "";
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      errors.push(`${path}.url must use http or https`);
    }
    if (isBlockedHost(url.hostname) && !allowPrivateNetwork) {
      errors.push(
        `${path}.url must not target localhost or private network addresses unless allowPrivateNetwork is true`,
      );
    }
    return value.trim();
  } catch {
    errors.push(`${path}.url must be a valid URL`);
    return value;
  }
}

function normalizeMethod(value, path, errors) {
  if (value === undefined) return "GET";

  if (typeof value !== "string") {
    errors.push(`${path} must be a string`);
    return "GET";
  }

  const method = value.trim().toUpperCase();
  if (!ALLOWED_METHODS.includes(method)) {
    errors.push(`${path} must be one of ${ALLOWED_METHODS.join(", ")}`);
    return "GET";
  }

  return method;
}

function normalizeHeaders(value, path, errors) {
  if (value === undefined) return {};

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${path} must be an object`);
    return {};
  }

  const headers = {};
  for (const [key, headerValue] of Object.entries(value)) {
    if (!isSafeHeaderName(key)) {
      errors.push(`${path}.${key} is not a valid header name`);
      continue;
    }

    if (!["string", "number", "boolean"].includes(typeof headerValue)) {
      errors.push(`${path}.${key} must be a string, number, or boolean`);
      continue;
    }

    headers[key] = String(headerValue);
  }

  return headers;
}

function normalizeExpectedStatuses(input, path, errors) {
  const raw = input.expectedStatuses ?? input.expectedStatus;
  if (raw === undefined) return null;

  const values = Array.isArray(raw) ? raw : [raw];
  const statuses = [];

  for (const value of values) {
    const status = Number(value);
    if (!Number.isInteger(status) || status < 100 || status > 599) {
      errors.push(`${path}.expectedStatuses must contain HTTP status codes`);
      continue;
    }
    statuses.push(status);
  }

  return [...new Set(statuses)];
}

function normalizeMaintenanceWindows(value, path, errors) {
  if (value === undefined) return [];

  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return [];
  }

  return value
    .map((window, index) => {
      const itemPath = `${path}[${index}]`;
      if (!window || typeof window !== "object" || Array.isArray(window)) {
        errors.push(`${itemPath} must be an object`);
        return null;
      }

      const start = normalizeDate(window.start, `${itemPath}.start`, errors);
      const end = normalizeDate(window.end, `${itemPath}.end`, errors);
      if (start && end && Date.parse(end) <= Date.parse(start)) {
        errors.push(`${itemPath}.end must be after start`);
      }

      const normalized = { start, end };
      if (typeof window.reason === "string" && window.reason.trim()) {
        normalized.reason = window.reason.trim().slice(0, 200);
      }
      return normalized;
    })
    .filter(Boolean);
}

function normalizeDate(value, path, errors) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO date string`);
    return "";
  }

  return new Date(value).toISOString();
}

function normalizeInteger(value, fallback, options) {
  const { path, min, max, errors } = options;
  if (value === undefined) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    errors.push(`${path} must be an integer between ${min} and ${max}`);
    return fallback;
  }

  return parsed;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isSafeHeaderName(value) {
  return /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(value);
}

function isBlockedHost(hostname) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "::1" || host === "[::1]") return true;

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;

  const octets = ipv4.slice(1).map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) return true;

  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}
