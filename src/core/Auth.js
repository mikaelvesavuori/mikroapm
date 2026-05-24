const defaultRateLimit = {
  maxAttempts: 5,
  windowMs: 60 * 1000,
  lockoutMs: 5 * 60 * 1000,
};

export function createAuthRateLimiter(options = {}) {
  const config = { ...defaultRateLimit, ...options };
  const attempts = new Map();

  return {
    check(key, now = Date.now()) {
      const state = attempts.get(key);
      if (!state) return null;

      if (state.lockedUntil && state.lockedUntil > now) {
        return Math.ceil((state.lockedUntil - now) / 1000);
      }

      if (state.firstAttemptAt + config.windowMs <= now) {
        attempts.delete(key);
      }

      return null;
    },

    recordFailure(key, now = Date.now()) {
      const state = attempts.get(key);
      const nextState =
        state && state.firstAttemptAt + config.windowMs > now
          ? { ...state, count: state.count + 1 }
          : { count: 1, firstAttemptAt: now, lockedUntil: 0 };

      if (nextState.count >= config.maxAttempts) {
        nextState.lockedUntil = now + config.lockoutMs;
      }

      attempts.set(key, nextState);
      return nextState.lockedUntil > now ? Math.ceil((nextState.lockedUntil - now) / 1000) : null;
    },

    recordSuccess(key) {
      attempts.delete(key);
    },
  };
}

export function getAdminAuthResult(request, adminToken, options = {}) {
  const { rateLimiter, rateLimitKey = getRateLimitKey(request) } = options;

  if (!adminToken) {
    return {
      ok: false,
      status: 503,
      error:
        "Admin API is disabled. Set MIKROAPM_ADMIN_TOKEN or admin.token in mikroapm.config.json, then restart MikroAPM.",
    };
  }

  const retryAfter = rateLimiter?.check(rateLimitKey);
  if (retryAfter) {
    return {
      ok: false,
      status: 429,
      error: "Too many admin sign-in attempts. Try again later.",
      retryAfter,
    };
  }

  const providedToken = getProvidedToken(request);
  if (!providedToken) {
    return {
      ok: false,
      status: 401,
      error: "Admin password required.",
    };
  }

  if (providedToken !== adminToken) {
    const failureRetryAfter = rateLimiter?.recordFailure(rateLimitKey);
    return {
      ok: false,
      status: failureRetryAfter ? 429 : 401,
      error: failureRetryAfter
        ? "Too many admin sign-in attempts. Try again later."
        : "Invalid admin password.",
      retryAfter: failureRetryAfter || undefined,
    };
  }

  rateLimiter?.recordSuccess(rateLimitKey);
  return { ok: true };
}

export function getPublicAuthResult(request, publicPassword, options = {}) {
  const { rateLimiter, rateLimitKey = getRateLimitKey(request) } = options;

  if (!publicPassword) return { ok: true };

  const retryAfter = rateLimiter?.check(`public:${rateLimitKey}`);
  if (retryAfter) {
    return {
      ok: false,
      status: 429,
      error: "Too many public status unlock attempts. Try again later.",
      retryAfter,
    };
  }

  const providedPassword = request.headers.get("x-mikroapm-public-password") || "";
  if (providedPassword !== publicPassword) {
    const failureRetryAfter = rateLimiter?.recordFailure(`public:${rateLimitKey}`);
    return {
      ok: false,
      status: failureRetryAfter ? 429 : 401,
      error: failureRetryAfter
        ? "Too many public status unlock attempts. Try again later."
        : "Public status is password protected.",
      retryAfter: failureRetryAfter || undefined,
    };
  }

  rateLimiter?.recordSuccess(`public:${rateLimitKey}`);
  return { ok: true };
}

export function getProvidedToken(request) {
  const authorization = request.headers.get("authorization") || "";
  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return request.headers.get("x-mikroapm-admin-token") || "";
}

export function adminJsonResponse(result) {
  const headers = { "Content-Type": "application/json" };
  if (result.retryAfter) headers["Retry-After"] = String(result.retryAfter);

  return new Response(JSON.stringify({ error: result.error }), {
    status: result.status,
    headers,
  });
}

export function getRateLimitKey(request) {
  return normalizeRateLimitKey(
    request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "local",
  );
}

function normalizeRateLimitKey(value) {
  const key = String(value || "local").trim();
  if (key.startsWith("[") && key.includes("]")) return key.slice(1, key.indexOf("]"));
  if (/^\\d+\\.\\d+\\.\\d+\\.\\d+:\\d+$/.test(key)) return key.slice(0, key.lastIndexOf(":"));
  return key || "local";
}
