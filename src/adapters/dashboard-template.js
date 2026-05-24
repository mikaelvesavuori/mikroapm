/**
 * Dashboard HTML template
 */
export function getDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MikroAPM</title>
  <meta name="description" content="Self-hosted uptime monitoring with health checks, alerts, and a public status dashboard.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta name="theme-color" content="#f4f6f9" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0b0d10" media="(prefers-color-scheme: dark)">
  <style>
    :root {
      --spacing-unit: 8px;
      --font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --font-mono: ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Monaco, Consolas, monospace;
      --color-bg: #f4f6f9;
      --color-bg-top: #f8fafc;
      --color-text: #1e293b;
      --color-text-secondary: #64748b;
      --color-border: #d6dce7;
      --color-border-strong: #bfccdc;
      --color-accent: #1665d8;
      --color-accent-strong: #0f56bd;
      --color-on-accent: #ffffff;
      --color-card-bg: #ffffff;
      --color-overlay: #f7f9fc;
      --color-hover: #eef3fa;
      --color-success: #1f8b57;
      --color-success-light: #dcf6e8;
      --color-success-border: #72d1a1;
      --color-warning: #b66a1f;
      --color-warning-light: #ffebc9;
      --color-warning-border: #f1b45d;
      --color-error: #b42318;
      --color-error-light: #ffe1e8;
      --color-error-border: #ec8498;
      --focus-ring: 0 0 0 2px rgb(22 101 216 / 22%);
      --shadow-overlay: 0 14px 34px rgb(15 23 42 / 14%);
      --radius: 8px;
      --control-size: 34px;
      color-scheme: light;
    }

    @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) {
        --color-bg: #0b0d10;
        --color-bg-top: #0b0d10;
        --color-text: #e2e8f0;
        --color-text-secondary: #94a3b8;
        --color-border: #2b3038;
        --color-border-strong: #3a414d;
        --color-accent: #60a5fa;
        --color-accent-strong: #93c5fd;
        --color-on-accent: #0b0d10;
        --color-card-bg: #121417;
        --color-overlay: #1a1d22;
        --color-hover: #23272e;
        --color-success: #57c68a;
        --color-success-light: #1f513b;
        --color-success-border: #7be0b0;
        --color-warning: #f7b863;
        --color-warning-light: #5b3d0f;
        --color-warning-border: #f5b764;
        --color-error: #f87171;
        --color-error-light: #5b2432;
        --color-error-border: #ff93a5;
        --focus-ring: 0 0 0 2px rgb(96 165 250 / 34%);
        --shadow-overlay: 0 20px 40px rgb(2 6 23 / 45%);
        color-scheme: dark;
      }
    }

    :root[data-theme="dark"] {
      --color-bg: #0b0d10;
      --color-bg-top: #0b0d10;
      --color-text: #e2e8f0;
      --color-text-secondary: #94a3b8;
      --color-border: #2b3038;
      --color-border-strong: #3a414d;
      --color-accent: #60a5fa;
      --color-accent-strong: #93c5fd;
      --color-on-accent: #0b0d10;
      --color-card-bg: #121417;
      --color-overlay: #1a1d22;
      --color-hover: #23272e;
      --color-success: #57c68a;
      --color-success-light: #1f513b;
      --color-success-border: #7be0b0;
      --color-warning: #f7b863;
      --color-warning-light: #5b3d0f;
      --color-warning-border: #f5b764;
      --color-error: #f87171;
      --color-error-light: #5b2432;
      --color-error-border: #ff93a5;
      --focus-ring: 0 0 0 2px rgb(96 165 250 / 34%);
      --shadow-overlay: 0 20px 40px rgb(2 6 23 / 45%);
      color-scheme: dark;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      min-height: 100vh;
      font-family: var(--font-family);
      font-size: 14px;
      line-height: 1.5;
      color: var(--color-text);
      background: linear-gradient(180deg, var(--color-bg-top), var(--color-bg));
      -webkit-font-smoothing: antialiased;
    }

    :root[data-theme="dark"] body {
      background: var(--color-bg);
    }

    .container {
      width: min(1180px, calc(100vw - 32px));
      margin: 0 auto;
      padding: calc(var(--spacing-unit) * 4) 0 calc(var(--spacing-unit) * 6);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: calc(var(--spacing-unit) * 1.5);
      min-height: 42px;
      margin-bottom: calc(var(--spacing-unit) * 2);
      padding: 4px;
      border: 1px solid color-mix(in srgb, var(--color-border) 86%, transparent);
      border-radius: var(--radius);
      background: color-mix(in srgb, var(--color-card-bg) 88%, transparent);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
    }

    .header h1 {
      flex: 1;
      min-width: 0;
      padding-left: calc(var(--spacing-unit) * 1.25);
      font-size: 13px;
      font-weight: 650;
      letter-spacing: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      flex: none;
      gap: 4px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .header-actions::-webkit-scrollbar {
      display: none;
    }

    .icon-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-width: var(--control-size);
      height: var(--control-size);
      min-height: 0;
      flex: none;
      padding: 0 10px;
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      cursor: pointer;
      font-size: 12px;
      font-weight: 650;
      line-height: 1;
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: border-color 140ms ease, background 140ms ease, color 140ms ease;
    }

    .icon-button:hover {
      border-color: var(--color-accent);
      background: var(--color-hover);
      color: var(--color-accent);
    }

    .icon-button:active {
      transform: scale(0.95);
    }

    .icon-button svg {
      display: block;
      width: 18px;
      height: 18px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.8;
    }

    .icon-button .theme-icon-path {
      fill: currentColor;
      stroke: none;
    }

    .card {
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      padding: calc(var(--spacing-unit) * 2);
      margin-bottom: calc(var(--spacing-unit) * 1.25);
    }

    .list-card {
      overflow: hidden;
      padding: 0;
    }

    .list-card > .section-header {
      min-height: 52px;
      margin-bottom: 0;
      padding: calc(var(--spacing-unit) * 2);
    }

    input,
    select {
      height: var(--control-size);
      min-height: 0;
      padding: 0 calc(var(--spacing-unit) * 1.25);
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      color: var(--color-text);
      font-size: 13px;
      font-family: inherit;
      transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
    }

    select:focus {
      outline: none;
      border-color: var(--color-accent);
      box-shadow: var(--focus-ring);
    }

    button {
      height: var(--control-size);
      min-height: 0;
      padding: 0 calc(var(--spacing-unit) * 1.5);
      background: var(--color-accent);
      color: var(--color-on-accent);
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 650;
      font-family: inherit;
      transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
    }

    button:hover {
      background: var(--color-accent-strong);
    }

    .view-controls-card {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: calc(var(--spacing-unit));
    }

    .view-controls-title {
      min-width: 0;
    }

    .view-controls-title strong {
      display: block;
      min-width: 0;
      overflow: hidden;
      font-size: 13px;
      font-weight: 650;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .view-control-fields {
      display: flex;
      align-items: center;
      flex: none;
      gap: calc(var(--spacing-unit));
    }

    .overview-link {
      width: var(--control-size);
      padding: 0;
    }

    .uptime-card {
      padding: calc(var(--spacing-unit) * 4);
      border-radius: var(--radius);
      text-align: center;
      margin-bottom: calc(var(--spacing-unit) * 1.25);
      background: var(--color-success-light);
      border: 1px solid var(--color-success-border);
    }

    .uptime-card.degraded {
      background: var(--color-warning-light);
      border-color: var(--color-warning-border);
    }

    .uptime-card.neutral {
      background: var(--color-card-bg);
      border-color: var(--color-border);
    }

    .uptime-card.down {
      background: var(--color-error-light);
      border-color: var(--color-error-border);
    }

    .uptime-card h2 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: calc(var(--spacing-unit));
      display: flex;
      align-items: center;
      justify-content: center;
      gap: calc(var(--spacing-unit));
    }

    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0;
      text-transform: uppercase;
      background: var(--color-overlay);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }

    .status-badge.success,
    .status-badge.degraded,
    .status-badge.down {
      color: var(--color-on-accent);
      border-color: transparent;
    }

    .status-badge.success { background: var(--color-success); }
    .status-badge.degraded { background: var(--color-warning); }
    .status-badge.down { background: var(--color-error); }
    .uptime {
      font-size: 52px;
      font-weight: 750;
      margin: calc(var(--spacing-unit) * 2) 0;
      line-height: 1;
      letter-spacing: 0;
    }

    .period {
      font-size: 14px;
      color: var(--color-text-secondary);
      margin-bottom: calc(var(--spacing-unit) * 3);
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: calc(var(--spacing-unit) * 3);
      margin-top: calc(var(--spacing-unit) * 3);
      padding-top: calc(var(--spacing-unit) * 3);
      border-top: 1px solid var(--color-border);
    }

    .stat { text-align: center; }

    .stat-value {
      font-size: 28px;
      font-weight: 750;
      line-height: 1;
      letter-spacing: 0;
    }

    .stat-label {
      font-size: 13px;
      color: var(--color-text-secondary);
      margin-top: calc(var(--spacing-unit));
      text-transform: uppercase;
      letter-spacing: 0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: calc(var(--spacing-unit) * 2);
    }

    .section-header h3 {
      font-size: 16px;
      font-weight: 600;
    }

    .section-hint {
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .daily-chart {
      display: flex;
      gap: 4px;
      height: 80px;
      align-items: flex-end;
      margin: calc(var(--spacing-unit) * 3) 0;
    }

    .day-bar {
      flex: 1;
      background: var(--color-success);
      border-radius: 4px 4px 0 0;
      cursor: pointer;
      position: relative;
      transition: box-shadow 140ms ease, opacity 140ms ease;
      min-height: 8px;
    }

    .day-bar:hover {
      opacity: 0.82;
    }

    .day-bar.active {
      opacity: 0.9;
      box-shadow: 0 0 0 2px var(--color-accent);
    }

    .day-bar.degraded { background: var(--color-warning); }
    .day-bar.down { background: var(--color-error); }
    .day-bar.no-data {
      background: repeating-linear-gradient(
        45deg,
        var(--color-border),
        var(--color-border) 4px,
        var(--color-overlay) 4px,
        var(--color-overlay) 8px
      );
      opacity: 0.6;
    }

    .day-bar-tooltip {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--color-overlay);
      color: var(--color-text);
      padding: calc(var(--spacing-unit)) calc(var(--spacing-unit) * 1.5);
      border-radius: 6px;
      font-size: 12px;
      white-space: nowrap;
      display: none;
      z-index: 10;
      box-shadow: var(--shadow-overlay);
      border: 1px solid var(--color-border);
    }

    .day-bar:hover .day-bar-tooltip { display: block; }

    .day-failures {
      overflow: hidden;
      background: transparent;
      border: 0;
      border-top: 1px solid var(--color-border);
      border-radius: 0;
      padding: 0;
      margin-top: calc(var(--spacing-unit) * 2);
    }

    .day-failures-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 48px;
      margin-bottom: 0;
      padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 2);
    }

    .day-failures-header h4 {
      font-size: 14px;
      font-weight: 600;
    }

    .close-btn {
      display: inline-grid;
      place-items: center;
      width: var(--control-size);
      min-width: var(--control-size);
      height: var(--control-size);
      min-height: 0;
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      padding: 0;
      color: var(--color-text-secondary);
    }

    .close-btn:hover {
      border-color: var(--color-border-strong);
      background: var(--color-hover);
      color: var(--color-text);
    }

    .close-btn svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.9;
    }

    .failure {
      padding: calc(var(--spacing-unit) * 2);
      margin: 0;
      background: transparent;
      border-top: 1px solid var(--color-border);
      border-radius: 0;
    }

    .failure:hover { background: var(--color-overlay); }

    .time {
      color: var(--color-text-secondary);
      font-size: 12px;
      margin-bottom: calc(var(--spacing-unit));
      font-family: var(--font-mono);
    }

    .failure-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: calc(var(--spacing-unit) * 1.5);
      font-size: 13px;
    }

    .failure-detail {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .failure-detail strong {
      color: var(--color-text-secondary);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    .failure-detail span {
      font-family: var(--font-mono);
      font-size: 13px;
    }

    .empty-state {
      text-align: center;
      padding: calc(var(--spacing-unit) * 6) calc(var(--spacing-unit) * 3);
      color: var(--color-text-secondary);
    }

    .empty-state-icon {
      font-size: 36px;
      margin-bottom: calc(var(--spacing-unit) * 2);
      opacity: 0.5;
    }

    .loading {
      text-align: center;
      padding: calc(var(--spacing-unit) * 6);
      color: var(--color-text-secondary);
    }

    .notice-card {
      display: grid;
      gap: calc(var(--spacing-unit));
    }

    .notice-card h2 {
      font-size: 16px;
      font-weight: 650;
    }

    .notice-card p {
      color: var(--color-text-secondary);
    }

    .unlock-card {
      display: grid;
      gap: calc(var(--spacing-unit) * 1.5);
      max-width: 420px;
      margin: calc(var(--spacing-unit) * 8) auto 0;
    }

    .unlock-card h2 {
      font-size: 16px;
      font-weight: 650;
    }

    .unlock-card p {
      color: var(--color-text-secondary);
    }

    .unlock-form {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: calc(var(--spacing-unit));
    }

    .site-list {
      display: grid;
      gap: 0;
      border-top: 1px solid var(--color-border);
    }

    .site-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: calc(var(--spacing-unit) * 2);
      align-items: center;
      padding: calc(var(--spacing-unit) * 2);
      border: 0;
      border-radius: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      text-decoration: none;
      transition: background 140ms ease;
    }

    .site-row + .site-row {
      border-top: 1px solid var(--color-border);
    }

    .site-row:last-child {
      border-radius: 0 0 var(--radius) var(--radius);
    }

    .site-row:hover {
      background: var(--color-hover);
    }

    .site-name {
      font-weight: 600;
    }

    .site-meta {
      color: var(--color-text-secondary);
      font-size: 13px;
      word-break: break-all;
    }

    .site-row .status-badge {
      justify-self: end;
    }

    @media (max-width: 768px) {
      .view-controls-card,
      .view-control-fields {
        align-items: stretch;
        flex-direction: column;
      }
      .stats { grid-template-columns: 1fr; }
      .site-row { grid-template-columns: 1fr; }
      .site-row .status-badge { justify-self: start; }
      .failure-details { grid-template-columns: 1fr; }
      .uptime { font-size: 42px; }
      .unlock-form { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MikroAPM</h1>
      <div class="header-actions">
        <a class="icon-button" href="/admin" aria-label="Admin">Admin</a>
        <button class="icon-button" onclick="toggleTheme()" aria-label="Toggle theme">
          <svg id="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path class="theme-icon-path" d="M12 20.5a8.5 8.5 0 0 0 8.5-8.5c0-.7-.1-1.05-.43-1.05-.2 0-.36.12-.56.22a5.8 5.8 0 0 1-2.58.58 4.68 4.68 0 0 1-4.68-4.68c0-.94.2-1.8.58-2.58.1-.2.22-.36.22-.56 0-.33-.35-.43-1.05-.43a8.5 8.5 0 1 0 0 17Z"/>
          </svg>
        </button>
      </div>
    </div>

    <div id="view-controls"></div>
    <div id="result"></div>
  </div>

  <script>
    const themeIcons = {
      moon: '<path class="theme-icon-path" d="M12 20.5a8.5 8.5 0 0 0 8.5-8.5c0-.7-.1-1.05-.43-1.05-.2 0-.36.12-.56.22a5.8 5.8 0 0 1-2.58.58 4.68 4.68 0 0 1-4.68-4.68c0-.94.2-1.8.58-2.58.1-.2.22-.36.22-.56 0-.33-.35-.43-1.05-.43a8.5 8.5 0 1 0 0 17Z"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.75v2.5M12 18.75v2.5M21.25 12h-2.5M5.25 12h-2.5M18.54 5.46l-1.77 1.77M7.23 16.77l-1.77 1.77M18.54 18.54l-1.77-1.77M7.23 7.23 5.46 5.46"/>',
    };
    const timezoneOptions = [
      ['local', 'Local Time'],
      ['UTC', 'UTC'],
      ['America/New_York', 'Eastern'],
      ['America/Chicago', 'Central'],
      ['America/Denver', 'Mountain'],
      ['America/Los_Angeles', 'Pacific'],
      ['Europe/London', 'London'],
      ['Europe/Paris', 'Paris'],
      ['Asia/Tokyo', 'Tokyo'],
      ['Asia/Shanghai', 'Shanghai'],
      ['Australia/Sydney', 'Sydney'],
    ];
    const viewControls = document.getElementById('view-controls');
    const result = document.getElementById('result');
    let currentData = null;
    let currentDomain = null;
    let currentDays = '30';
    let currentTimezone = 'local';
    let publicPassword = sessionStorage.getItem('mikroapmPublicPassword') || '';

    function initTheme() {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = savedTheme || (prefersDark ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
      updateThemeIcon(theme);
    }

    function toggleTheme() {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
    }

    function updateThemeIcon(theme) {
      document.getElementById('theme-icon').innerHTML = theme === 'dark' ? themeIcons.sun : themeIcons.moon;
    }

    function refreshData() {
      if (currentDomain) {
        loadSiteDetail(currentDomain, false);
      } else {
        loadStatusPage();
      }
    }

    function publicHeaders() {
      return publicPassword ? { 'x-mikroapm-public-password': publicPassword } : {};
    }

    function publicFetch(path) {
      return fetch(path, { headers: publicHeaders() });
    }

    function renderPublicUnlock(message = 'Public status is password protected.') {
      viewControls.innerHTML = '';
      result.innerHTML = \`
        <div class="card unlock-card">
          <h2>Public status locked</h2>
          <p>\${message}</p>
          <div class="unlock-form">
            <input id="public-password" type="password" placeholder="Enter password" autocomplete="current-password" onkeydown="if (event.key === 'Enter') unlockPublicStatus()">
            <button onclick="unlockPublicStatus()" type="button">Unlock</button>
          </div>
        </div>
      \`;
      document.getElementById('public-password')?.focus();
    }

    function unlockPublicStatus() {
      publicPassword = document.getElementById('public-password')?.value.trim() || '';
      if (publicPassword) {
        sessionStorage.setItem('mikroapmPublicPassword', publicPassword);
      } else {
        sessionStorage.removeItem('mikroapmPublicPassword');
      }
      refreshData();
    }

    function handlePublicAuthError(response, data) {
      if (response.status !== 401 && response.status !== 429) return false;
      if (response.status === 401) {
        sessionStorage.removeItem('mikroapmPublicPassword');
        publicPassword = '';
      }
      renderPublicUnlock(data?.error || 'Public status is password protected.');
      return true;
    }

    function getTimezone() {
      const tz = document.getElementById('timezone')?.value || currentTimezone;
      currentTimezone = tz;
      return tz === 'local' ? Intl.DateTimeFormat().resolvedOptions().timeZone : tz;
    }

    function getDays() {
      currentDays = document.getElementById('days')?.value || currentDays;
      return currentDays;
    }

    function formatDateTime(timestamp, timezone) {
      const options = {
        timeZone: timezone,
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      };
      return new Intl.DateTimeFormat('en-US', options).format(new Date(timestamp));
    }

    async function loadStatusPage() {
      currentDomain = null;
      viewControls.innerHTML = '';
      result.innerHTML = '<div class="card loading">Loading status...</div>';

      try {
        const response = await publicFetch('/api/status');
        const data = await response.json();
        if (handlePublicAuthError(response, data)) return;
        if (!response.ok) throw new Error(data.error || 'Failed to load status');
        renderStatusPage(data);
      } catch (error) {
        result.innerHTML = \`<div class="card" style="color: var(--color-error);">Error: \${error.message}</div>\`;
      }
    }

    function renderStatusPage(data) {
      const sites = data.sites || [];
      if (sites.length === 0) {
        result.innerHTML = \`
          <div class="card empty-state">
            <div>No monitored sites configured yet.</div>
          </div>
        \`;
        return;
      }

      const rows = sites.map((site) => {
        const current = site.currentStatus || {};
        const status = current.status || 'unknown';
        const badgeClass = status === 'operational'
          ? 'status-badge success'
          : status === 'down'
            ? 'status-badge down'
            : status === 'maintenance'
              ? 'status-badge degraded'
              : 'status-badge';
        const label = status.replace('-', ' ');
        const checkedAt = current.checkedAt
          ? formatDateTime(current.checkedAt, getTimezone())
          : 'No checks yet';

        return \`
          <a class="site-row" href="/\${encodeURIComponent(site.domain)}" onclick="openDomain('\${site.domain}', event)">
            <div>
              <div class="site-name">\${site.name || site.domain}</div>
              <div class="site-meta">\${site.url}</div>
              <div class="site-meta">\${current.message || 'No status message'} · \${checkedAt}</div>
            </div>
            <span class="\${badgeClass}">\${label}</span>
          </a>
        \`;
      }).join('');

      result.innerHTML = \`
        <div class="card list-card">
          <div class="section-header">
            <h3>Public Status</h3>
            <div class="section-hint">\${new Date(data.generatedAt).toLocaleString()}</div>
          </div>
          <div class="site-list">\${rows}</div>
        </div>
      \`;
    }

    function openDomain(domain, event) {
      event?.preventDefault();
      loadSiteDetail(domain);
    }

    function showOverview(event) {
      event?.preventDefault();
      currentDomain = null;
      currentData = null;
      window.history.pushState({}, '', '/');
      loadStatusPage();
    }

    function updateSiteView() {
      if (currentDomain) loadSiteDetail(currentDomain);
    }

    function renderSiteControls(domain) {
      viewControls.innerHTML = \`
        <div class="card view-controls-card">
          <div class="view-control-fields">
            <a class="icon-button overview-link" href="/" onclick="showOverview(event)" aria-label="Back to overview">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 6l-6 6 6 6"/>
              </svg>
            </a>
            <select id="days" aria-label="Date range">
              <option value="7"\${currentDays === '7' ? ' selected' : ''}>7 days</option>
              <option value="30"\${currentDays === '30' ? ' selected' : ''}>30 days</option>
              <option value="90"\${currentDays === '90' ? ' selected' : ''}>90 days</option>
            </select>
            <select id="timezone" aria-label="Timezone">
              \${timezoneOptions.map(([value, label]) => \`<option value="\${value}"\${currentTimezone === value ? ' selected' : ''}>\${label}</option>\`).join('')}
            </select>
            <button class="icon-button" onclick="updateSiteView()" aria-label="Update view" type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16.02 9.35h4.23V5.12"/>
                <path d="M20.25 9.35A8.25 8.25 0 0 0 5.02 6.1"/>
                <path d="M7.98 14.65H3.75v4.23"/>
                <path d="M3.75 14.65a8.25 8.25 0 0 0 15.23 3.25"/>
              </svg>
            </button>
          </div>
        </div>
      \`;
    }

    async function loadSiteDetail(domain, updateUrl = true) {
      if (!domain) return;

      currentDomain = domain;
      currentDays = getDays();
      renderSiteControls(domain);

      if (updateUrl) {
        const url = new URL(window.location);
        url.pathname = '/' + encodeURIComponent(domain);
        url.searchParams.set('days', currentDays);
        window.history.pushState({}, '', url);
      }

      result.innerHTML = '<div class="card loading">Loading data...</div>';

      try {
        const response = await publicFetch(\`/api/uptime/\${encodeURIComponent(domain)}?days=\${currentDays}\`);
        const data = await response.json();
        if (handlePublicAuthError(response, data)) return;
        if (!response.ok) {
          renderSiteError(domain, data);
          return;
        }
        currentData = data;
        renderUptimeData(data);
      } catch (error) {
        result.innerHTML = \`<div class="card" style="color: var(--color-error);">Error: \${error.message}</div>\`;
      }
    }

    function renderSiteError(domain, data) {
      if (data?.code === 'SITE_NOT_CONFIGURED') {
        currentDomain = null;
        viewControls.innerHTML = '';
      }
      result.innerHTML = \`
        <div class="card notice-card">
          <h2>Site is not monitored</h2>
          <p>\${data?.error || domain + ' is not configured in this MikroAPM instance.'}</p>
        </div>
      \`;
    }

    function renderUptimeData(data) {
      const uptimeValue = data.uptime === 'N/A' ? null : parseFloat(data.uptime);
      let cardClass = 'uptime-card';
      let statusBadgeClass = 'status-badge success';
      let statusText = 'Operational';
      const currentStatus = data.currentStatus || {};

      if (currentStatus.status === 'down') {
        cardClass += ' down';
        statusBadgeClass = 'status-badge down';
        statusText = 'Down';
      } else if (currentStatus.status === 'paused') {
        cardClass += ' neutral';
        statusBadgeClass = 'status-badge';
        statusText = 'Paused';
      } else if (currentStatus.status === 'maintenance') {
        cardClass += ' degraded';
        statusBadgeClass = 'status-badge degraded';
        statusText = 'Maintenance';
      } else if (uptimeValue === null) {
        cardClass += ' neutral';
        statusBadgeClass = 'status-badge';
        statusText = 'No Data';
      } else if (uptimeValue < 99.9) {
        cardClass += ' degraded';
        statusBadgeClass = 'status-badge degraded';
        statusText = 'Degraded';
      }
      if (
        !['down', 'paused', 'maintenance'].includes(currentStatus.status) &&
        uptimeValue !== null &&
        uptimeValue < 95
      ) {
        cardClass += ' down';
        statusBadgeClass = 'status-badge down';
        statusText = 'Down';
      }

      const badges = \`<span class="\${statusBadgeClass}">\${statusText}</span>\`;

      let chartHtml = '<div class="daily-chart">';
      data.dailySummaries.forEach((day) => {
        const dayUptime = day.uptime === 'N/A' ? null : parseFloat(day.uptime);
        let barClass = 'day-bar';
        let height = 0;

        if (dayUptime === null) {
          barClass += ' no-data';
          height = 5;  // Small bar to indicate "no data"
        } else {
          if (dayUptime < 99.9) barClass += ' degraded';
          if (dayUptime < 95) barClass += ' down';
          height = Math.max(10, dayUptime);
        }

        chartHtml += \`
          <div class="\${barClass}" style="height: \${height}%"
               onclick="loadDayFailures('\${day.date}')"
               data-date="\${day.date}">
            <div class="day-bar-tooltip">
              \${day.date}<br/>
              \${day.uptime}<br/>
              \${day.failures} failures
            </div>
          </div>
        \`;
      });
      chartHtml += '</div>';

      const html = \`
        <div class="\${cardClass}">
          <h2>\${data.domain} \${badges}</h2>
          <div class="uptime">\${data.uptime}</div>
          <div class="period">\${data.period}</div>
          <div class="period">\${currentStatus.message || 'No current check result'}\${currentStatus.checkedAt ? ' · ' + formatDateTime(currentStatus.checkedAt, getTimezone()) : ''}</div>
          <div class="stats">
            <div class="stat">
              <div class="stat-value">\${data.totalChecks.toLocaleString()}</div>
              <div class="stat-label">Checks</div>
            </div>
            <div class="stat">
              <div class="stat-value">\${data.totalFailures}</div>
              <div class="stat-label">Failures</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="section-header">
            <h3>Daily Uptime</h3>
            <div class="section-hint">Click bars for details</div>
          </div>
          \${chartHtml}
          <div id="day-failures"></div>
        </div>
      \`;

      document.getElementById('result').innerHTML = html;
    }

    async function loadDayFailures(date) {
      document.querySelectorAll('.day-bar').forEach(bar => {
        if (bar.dataset.date === date) {
          bar.classList.add('active');
        } else {
          bar.classList.remove('active');
        }
      });

      const container = document.getElementById('day-failures');
      container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--color-text-secondary);">Loading...</div>';

      try {
        const response = await publicFetch(\`/api/failures/\${encodeURIComponent(currentDomain)}/\${date}\`);
        const data = await response.json();
        if (handlePublicAuthError(response, data)) return;
        if (!response.ok) throw new Error(data.error || 'Failed to load failures');
        renderDayFailures(data);
      } catch (error) {
        container.innerHTML = \`<div style="color: var(--color-error); padding: 16px;">Error: \${error.message}</div>\`;
      }
    }

    function renderDayFailures(data) {
      const container = document.getElementById('day-failures');
      const timezone = getTimezone();

      if (data.failures.length === 0) {
        container.innerHTML = \`
          <div class="day-failures">
            <div class="day-failures-header">
              <h4>\${data.date}</h4>
              <button class="close-btn" onclick="closeDayFailures()" aria-label="Close selected day">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12"/>
                  <path d="M18 6 6 18"/>
                </svg>
              </button>
            </div>
            <div class="empty-state">
              <div class="empty-state-icon">✓</div>
              <div>No failures on this day</div>
            </div>
          </div>
        \`;
        return;
      }

      let failuresHtml = data.failures.map(f => \`
        <div class="failure">
          <div class="time">\${formatDateTime(f.timestamp, timezone)}</div>
          <div class="failure-details">
            <div class="failure-detail">
              <strong>Status</strong>
              <span>\${f.status || 'Timeout'}</span>
            </div>
            <div class="failure-detail">
              <strong>Message</strong>
              <span>\${f.message}</span>
            </div>
            <div class="failure-detail">
              <strong>Duration</strong>
              <span>\${f.duration}ms</span>
            </div>
          </div>
        </div>
      \`).join('');

      container.innerHTML = \`
        <div class="day-failures">
          <div class="day-failures-header">
            <h4>\${data.date} · \${data.failures.length} failures</h4>
            <button class="close-btn" onclick="closeDayFailures()" aria-label="Close selected day">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12"/>
                <path d="M18 6 6 18"/>
              </svg>
            </button>
          </div>
          \${failuresHtml}
        </div>
      \`;
    }

    function closeDayFailures() {
      document.getElementById('day-failures').innerHTML = '';
      document.querySelectorAll('.day-bar').forEach(bar => {
        bar.classList.remove('active');
      });
    }

    // Initialize from URL on page load
    function initFromURL() {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);

      // Extract domain from path (e.g., /mikaelvesavuori.se)
      const domain = decodeURIComponent(path.substring(1)); // Remove leading /

      if (domain && domain !== '') {
        currentDays = params.get('days') || '30';
        loadSiteDetail(domain, false);
      } else {
        loadStatusPage();
      }
    }

    initTheme();
    initFromURL();
  </script>
</body>
</html>`;
}
