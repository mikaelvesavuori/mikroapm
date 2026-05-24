export function getAdminHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MikroAPM Admin</title>
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
      color-scheme: light;
      --font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --font-mono: ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Monaco, Consolas, monospace;
      --bg: #f4f6f9;
      --bg-top: #f8fafc;
      --text: #1e293b;
      --muted: #64748b;
      --border: #d6dce7;
      --accent: #1665d8;
      --accent-strong: #0f56bd;
      --accent-soft: rgb(22 101 216 / 14%);
      --on-accent: #ffffff;
      --surface: #ffffff;
      --surface-soft: #f7f9fc;
      --surface-hover: #eef3fa;
      --danger: #b42318;
      --danger-strong: #8f1b13;
      --focus-ring: 0 0 0 2px rgb(22 101 216 / 22%);
      --radius: 8px;
      --control-size: 34px;
    }

    @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) {
        color-scheme: dark;
        --bg: #0b0d10;
        --bg-top: #0b0d10;
        --text: #e2e8f0;
        --muted: #94a3b8;
        --border: #2b3038;
        --accent: #60a5fa;
        --accent-strong: #93c5fd;
        --accent-soft: rgb(96 165 250 / 22%);
        --on-accent: #0b0d10;
        --surface: #121417;
        --surface-soft: #1a1d22;
        --surface-hover: #23272e;
        --danger: #f87171;
        --danger-strong: #ff9aa7;
        --focus-ring: 0 0 0 2px rgb(96 165 250 / 34%);
      }
    }

    :root[data-theme="dark"] {
      color-scheme: dark;
      --bg: #0b0d10;
      --bg-top: #0b0d10;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --border: #2b3038;
      --accent: #60a5fa;
      --accent-strong: #93c5fd;
      --accent-soft: rgb(96 165 250 / 22%);
      --on-accent: #0b0d10;
      --surface: #121417;
      --surface-soft: #1a1d22;
      --surface-hover: #23272e;
      --danger: #f87171;
      --danger-strong: #ff9aa7;
      --focus-ring: 0 0 0 2px rgb(96 165 250 / 34%);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: var(--font-family);
      font-size: 14px;
      line-height: 1.5;
      background: linear-gradient(180deg, var(--bg-top), var(--bg));
      color: var(--text);
      -webkit-font-smoothing: antialiased;
    }

    :root[data-theme="dark"] body {
      background: var(--bg);
    }

    main {
      width: min(980px, calc(100vw - 32px));
      margin: 0 auto;
      padding: 32px 0 48px;
    }

    header,
    .header-actions,
    .section-head,
    .switch-row {
      display: flex;
      align-items: center;
    }

    header {
      justify-content: space-between;
      gap: 12px;
      min-height: 42px;
      margin-bottom: 10px;
      padding: 4px;
      border: 1px solid color-mix(in srgb, var(--border) 86%, transparent);
      border-radius: var(--radius);
      background: color-mix(in srgb, var(--surface) 88%, transparent);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
    }

    h1,
    h2,
    p {
      margin: 0;
    }

    h1 {
      flex: 1;
      min-width: 0;
      padding-left: 10px;
      font-size: 13px;
      font-weight: 650;
      letter-spacing: 0;
    }

    h2 {
      font-size: 16px;
      font-weight: 650;
    }

    .header-actions {
      flex: none;
      gap: 4px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .header-actions::-webkit-scrollbar {
      display: none;
    }

    a { color: inherit; }

    .link-button,
    .icon-button,
    button {
      height: var(--control-size);
      min-height: 0;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font: inherit;
      font-size: 12px;
      font-weight: 650;
      cursor: pointer;
      transition: border-color 140ms ease, background 140ms ease, color 140ms ease;
    }

    .link-button,
    .icon-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      background: var(--surface);
      color: var(--muted);
      text-decoration: none;
    }

    .link-button svg {
      width: 16px;
      height: 16px;
      margin-right: 2px;
    }

    .link-button {
      padding: 0 10px;
    }

    .icon-button {
      width: var(--control-size);
      padding: 0;
    }

    .link-button:hover,
    .icon-button:hover {
      border-color: var(--accent);
      background: var(--surface-hover);
      color: var(--accent);
    }

    svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.8;
    }

    .theme-icon-path {
      fill: currentColor;
      stroke: none;
    }

    section {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      margin: 10px 0;
      background: var(--surface);
    }

    .auth-section {
      padding: 16px;
    }

    .section-head {
      justify-content: space-between;
      gap: 12px;
      min-height: 52px;
      padding: 14px 16px;
    }

    .section-note {
      color: var(--muted);
      font-size: 13px;
    }

    label {
      display: grid;
      gap: 7px;
      min-width: 0;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    input,
    select,
    textarea {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0 10px;
      font: inherit;
      color: var(--text);
      background: var(--surface);
      transition: border-color 140ms ease, box-shadow 140ms ease;
    }

    input,
    select {
      height: var(--control-size);
      min-height: 0;
    }

    input:focus,
    select:focus,
    textarea:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: var(--focus-ring);
    }

    textarea {
      min-height: 72px;
      padding: 10px 12px;
      font-family: var(--font-mono);
      font-size: 13px;
      line-height: 1.45;
      resize: vertical;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 0 12px;
      border-color: var(--accent);
      background: var(--accent);
      color: var(--on-accent);
    }

    button:hover {
      border-color: var(--accent-strong);
      background: var(--accent-strong);
    }

    button.secondary {
      border-color: var(--border);
      background: var(--surface-soft);
      color: var(--text);
    }

    button.secondary:hover {
      border-color: var(--accent);
      background: var(--accent-soft);
      color: var(--accent);
    }

    button.danger {
      border-color: var(--danger);
      background: var(--danger);
      color: var(--on-accent);
    }

    button.danger:hover {
      border-color: var(--danger-strong);
      background: var(--danger-strong);
    }

    button:disabled,
    button:disabled:hover {
      border-color: var(--border);
      background: var(--surface-soft);
      color: var(--muted);
      cursor: not-allowed;
      opacity: 0.58;
    }

    input:disabled,
    select:disabled,
    textarea:disabled {
      cursor: not-allowed;
      opacity: 0.58;
    }

    .auth-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: end;
    }

    .auth-actions {
      display: flex;
      gap: 8px;
      align-items: end;
    }

    .site-section {
      overflow: hidden;
    }

    .site-list {
      border-top: 1px solid var(--border);
    }

    .site-row {
      display: grid;
      gap: 12px;
      padding: 16px;
      border-top: 1px solid var(--border);
    }

    .site-row:first-child {
      border-top: 0;
    }

    .site-row:last-child {
      border-radius: 0 0 var(--radius) var(--radius);
    }

    .site-row:hover {
      background: color-mix(in srgb, var(--surface-hover) 46%, transparent);
    }

    .public-site-row {
      display: grid;
      gap: 5px;
      padding: 16px;
      border-top: 1px solid var(--border);
    }

    .public-site-row:first-child {
      border-top: 0;
    }

    .public-site-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .public-site-name {
      min-width: 0;
      font-size: 14px;
      font-weight: 650;
    }

    .public-site-url {
      color: var(--muted);
      overflow-wrap: anywhere;
    }

    .status-pill {
      flex: none;
      min-width: 86px;
      padding: 4px 8px;
      border: 1px solid var(--border);
      border-radius: 999px;
      color: var(--muted);
      font-size: 11px;
      font-weight: 750;
      text-align: center;
      text-transform: uppercase;
    }

    .status-pill.operational {
      display: none;
      border-color: color-mix(in srgb, #16a34a 48%, var(--border));
      color: #15803d;
      background: rgb(22 163 74 / 10%);
    }

    .status-pill.down {
      border-color: color-mix(in srgb, var(--danger) 52%, var(--border));
      color: var(--danger);
      background: rgb(180 35 24 / 10%);
    }

    :root[data-theme="dark"] .status-pill.operational {
      color: #86efac;
      background: rgb(34 197 94 / 14%);
    }

    .site-row-head {
      display: grid;
      grid-template-columns: minmax(140px, 0.7fr) minmax(220px, 1.3fr) auto;
      gap: 8px;
      align-items: end;
    }

    .site-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
    }

    .site-grid .wide {
      grid-column: span 2;
    }

    .switch-row {
      flex-wrap: wrap;
      gap: 14px;
      padding-top: 2px;
    }

    .switch-field {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--text);
      font-size: 13px;
      font-weight: 650;
      text-transform: none;
    }

    .switch-field input {
      width: 16px;
      height: 16px;
      min-height: 0;
      padding: 0;
      accent-color: var(--accent);
    }

    .remove-site {
      width: var(--control-size);
      min-width: var(--control-size);
      padding: 0;
    }

    .empty-row {
      padding: 32px 16px;
      color: var(--muted);
      text-align: center;
    }

    .actions {
      display: grid;
      gap: 10px;
      padding: 14px 16px 16px;
      border-top: 1px solid var(--border);
    }

    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    #message {
      min-height: 24px;
      margin: 0;
      color: var(--muted);
      font-size: 12px;
      text-align: center;
      white-space: pre-wrap;
    }

    .command-result {
      display: inline-grid;
      justify-self: center;
      grid-auto-flow: column;
      grid-auto-columns: max-content;
      align-items: center;
      gap: 8px;
      max-width: 100%;
      padding: 6px 10px;
      border: 1px solid color-mix(in srgb, #16a34a 40%, var(--border));
      border-radius: 999px;
      background: rgb(22 163 74 / 10%);
      color: #15803d;
      font-size: 12px;
      font-weight: 650;
    }

    :root[data-theme="dark"] .command-result {
      color: #86efac;
      background: rgb(34 197 94 / 14%);
    }

    .command-result svg {
      width: 14px;
      height: 14px;
      stroke-width: 2.2;
    }

    .command-result-muted {
      color: var(--muted);
      font-weight: 550;
    }

    @media (max-width: 760px) {
      .auth-grid,
      .site-row-head,
      .site-grid {
        grid-template-columns: 1fr;
      }

      .auth-actions {
        align-items: stretch;
        flex-direction: column;
      }

      .site-grid .wide {
        grid-column: auto;
      }

      .remove-site {
        justify-self: end;
      }

      .action-buttons {
        flex-direction: column;
        align-items: stretch;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>MikroAPM Admin</h1>
      <div class="header-actions">
        <a class="link-button" href="/">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6"/>
          </svg>
          Back to status
        </a>
        <button class="icon-button" onclick="toggleTheme()" aria-label="Toggle theme" type="button">
          <svg id="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path class="theme-icon-path" d="M12 20.5a8.5 8.5 0 0 0 8.5-8.5c0-.7-.1-1.05-.43-1.05-.2 0-.36.12-.56.22a5.8 5.8 0 0 1-2.58.58 4.68 4.68 0 0 1-4.68-4.68c0-.94.2-1.8.58-2.58.1-.2.22-.36.22-.56 0-.33-.35-.43-1.05-.43a8.5 8.5 0 1 0 0 17Z"/>
          </svg>
        </button>
      </div>
    </header>

    <section class="auth-section">
      <div class="auth-grid">
        <label for="admin-password">
          Admin password
          <input id="admin-password" type="password" placeholder="Enter admin password" autocomplete="current-password">
        </label>
        <div class="auth-actions">
          <button id="unlock-admin" onclick="unlockAdmin()" type="button">Unlock</button>
        </div>
      </div>
    </section>

    <section class="site-section">
      <div class="section-head">
        <div>
          <h2>Sites</h2>
          <p class="section-note">Configure monitored targets.</p>
        </div>
        <button onclick="addSite()" data-admin-action type="button" disabled>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14"/>
            <path d="M5 12h14"/>
          </svg>
          Add site
        </button>
      </div>
      <div id="site-list" class="site-list"></div>
      <div class="actions">
        <div id="message" aria-live="polite"></div>
        <div class="action-buttons">
          <button onclick="saveSites()" data-admin-action type="button" disabled>Save sites</button>
          <button class="secondary" onclick="runChecks()" data-admin-action type="button" disabled>Run checks</button>
          <button class="danger" onclick="cleanup()" data-admin-action type="button" disabled>Cleanup expired records</button>
        </div>
      </div>
    </section>
  </main>

  <script>
    const themeIcons = {
      moon: '<path class="theme-icon-path" d="M12 20.5a8.5 8.5 0 0 0 8.5-8.5c0-.7-.1-1.05-.43-1.05-.2 0-.36.12-.56.22a5.8 5.8 0 0 1-2.58.58 4.68 4.68 0 0 1-4.68-4.68c0-.94.2-1.8.58-2.58.1-.2.22-.36.22-.56 0-.33-.35-.43-1.05-.43a8.5 8.5 0 1 0 0 17Z"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.75v2.5M12 18.75v2.5M21.25 12h-2.5M5.25 12h-2.5M18.54 5.46l-1.77 1.77M7.23 16.77l-1.77 1.77M18.54 18.54l-1.77-1.77M7.23 7.23 5.46 5.46"/>',
    };
    const methods = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'];
    const adminDisabledMessage = 'Admin API is disabled. Set MIKROAPM_ADMIN_TOKEN or admin.token in mikroapm.config.json, then restart MikroAPM.';
    let sites = [];
    let adminActionsEnabled = false;
    let adminPassword = '';

    const passwordInput = document.getElementById('admin-password');
    const unlockAdminButton = document.getElementById('unlock-admin');
    const siteList = document.getElementById('site-list');
    const message = document.getElementById('message');

    localStorage.removeItem('mikroapmAdminToken');
    adminPassword = sessionStorage.getItem('mikroapmAdminPassword') || '';
    passwordInput.value = adminPassword;
    passwordInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') unlockAdmin();
    });
    initTheme();
    renderSitePlaceholder('Loading monitored sites...');
    setAdminActionsEnabled(false);
    loadSites();

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

    async function unlockAdmin() {
      adminPassword = passwordInput.value.trim();
      if (adminPassword) {
        sessionStorage.setItem('mikroapmAdminPassword', adminPassword);
      } else {
        sessionStorage.removeItem('mikroapmAdminPassword');
      }
      setAdminActionsEnabled(false);
      renderSitePlaceholder('Loading monitored sites...');
      await loadSites();
    }

    function headers() {
      const requestHeaders = {
        'Content-Type': 'application/json',
      };
      if (adminPassword) requestHeaders.Authorization = 'Bearer ' + adminPassword;
      return requestHeaders;
    }

    function setMessage(text, isError = false) {
      const displayText = isAdminDisabledMessage(text) ? adminDisabledMessage : text;
      message.style.color = isError ? 'var(--danger)' : 'var(--muted)';
      message.textContent = displayText;
      if (isAdminDisabledMessage(displayText)) {
        setAdminActionsEnabled(false);
      }
    }

    function isAdminDisabledMessage(text) {
      return String(text || '').includes('Admin API is disabled');
    }

    function setAdminActionsEnabled(enabled) {
      adminActionsEnabled = enabled;
      updateAdminAuthState(enabled);
      document.querySelectorAll('[data-admin-action]').forEach(function (button) {
        button.disabled = !enabled;
      });
      siteList.querySelectorAll('input, select, textarea, button').forEach(function (control) {
        control.disabled = !enabled;
      });
    }

    async function loadSites() {
      try {
        const response = await fetch('/api/sites', { headers: headers() });
        const data = await response.json();
        if (!response.ok) {
          const error = new Error(formatError(data, 'Failed to load sites'));
          error.status = response.status;
          throw error;
        }
        sites = Array.isArray(data) ? data : [];
        renderSites();
        setAdminActionsEnabled(true);
        setMessage('Admin unlocked. Sites loaded.');
      } catch (error) {
        setAdminActionsEnabled(false);
        setMessage(formatLoadSitesError(error), true);
        await loadPublicSites();
      }
    }

    async function loadPublicSites() {
      try {
        const response = await fetch('/api/status');
        const data = await response.json();
        if (!response.ok) throw new Error(formatError(data, 'Failed to load monitored sites'));
        renderPublicSites(Array.isArray(data.sites) ? data.sites : []);
      } catch {
        renderSitePlaceholder('Monitored sites could not be loaded.');
      }
    }

    function renderSites() {
      if (sites.length === 0) {
        renderSitePlaceholder('No sites are configured in the admin API.');
        return;
      }

      siteList.innerHTML = sites.map(siteRowHtml).join('');
    }

    function renderPublicSites(publicSites) {
      if (publicSites.length === 0) {
        renderSitePlaceholder('No monitored sites are published yet.');
        return;
      }

      siteList.innerHTML = publicSites.map(publicSiteRowHtml).join('');
    }

    function renderSitePlaceholder(text) {
      siteList.innerHTML = '<div class="empty-row">' + escapeText(text) + '</div>';
    }

    function publicSiteRowHtml(site) {
      const name = site.name || site.domain || site.url || 'Monitored site';
      const status = site.currentStatus?.status || 'unknown';
      const statusHtml = status === 'operational'
        ? ''
        : '<div class="status-pill ' + escapeAttr(status) + '">' + escapeText(status) + '</div>';
      return '<article class="public-site-row">' +
        '<div class="public-site-main">' +
          '<div class="public-site-name">' + escapeText(name) + '</div>' +
          statusHtml +
        '</div>' +
        '<div class="public-site-url">' + escapeText(site.url || '') + '</div>' +
      '</article>';
    }

    function siteRowHtml(site, index) {
      return '<article class="site-row" data-index="' + index + '">' +
        '<div class="site-row-head">' +
          fieldHtml('Name', 'name', site.name || '', 'Website') +
          fieldHtml('URL', 'url', site.url || '', 'https://example.com') +
          '<button class="danger remove-site" onclick="removeSite(' + index + ')" data-admin-action type="button" aria-label="Remove site">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12"/><path d="M18 6 6 18"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="site-grid">' +
          selectFieldHtml('Method', 'method', site.method || 'GET') +
          fieldHtml('Expected statuses', 'expectedStatuses', formatStatuses(site), '200, 204') +
          fieldHtml('Timeout ms', 'timeout', numericValue(site.timeout), '10000', 'number') +
          fieldHtml('Max latency ms', 'maxLatencyMs', numericValue(site.maxLatencyMs), '2000', 'number') +
          fieldHtml('Retries', 'retries', numericValue(site.retries), '0', 'number') +
          fieldHtml('Retry delay ms', 'retryDelayMs', numericValue(site.retryDelayMs), '1000', 'number') +
          fieldHtml('Alert email', 'alertEmail', site.alertEmail || '', 'you@example.com', 'email') +
          fieldHtml('Expected text', 'expectedText', site.expectedText || '', 'ok') +
          fieldHtml('Expected regex', 'expectedRegex', site.expectedRegex || '', '^ok$', 'text', 'wide') +
          textareaFieldHtml('Request body', 'body', site.body || '', 'Only used for POST, PUT, PATCH, or DELETE') +
        '</div>' +
        '<div class="switch-row">' +
          checkboxFieldHtml('Paused', 'paused', site.paused === true) +
          checkboxFieldHtml('Allow private network', 'allowPrivateNetwork', site.allowPrivateNetwork === true) +
        '</div>' +
      '</article>';
    }

    function fieldHtml(label, field, value, placeholder, type = 'text', className = '') {
      const classes = className ? ' class="' + className + '"' : '';
      return '<label' + classes + '>' + label +
        '<input data-field="' + field + '" type="' + type + '" value="' + escapeAttr(value) + '" placeholder="' + escapeAttr(placeholder) + '">' +
      '</label>';
    }

    function textareaFieldHtml(label, field, value, placeholder) {
      return '<label class="wide">' + label +
        '<textarea data-field="' + field + '" placeholder="' + escapeAttr(placeholder) + '">' + escapeText(value) + '</textarea>' +
      '</label>';
    }

    function selectFieldHtml(label, field, value) {
      const options = methods.map(function (method) {
        return '<option value="' + method + '"' + (method === value ? ' selected' : '') + '>' + method + '</option>';
      }).join('');
      return '<label>' + label + '<select data-field="' + field + '">' + options + '</select></label>';
    }

    function checkboxFieldHtml(label, field, checked) {
      return '<label class="switch-field"><input data-field="' + field + '" type="checkbox"' + (checked ? ' checked' : '') + '><span>' + label + '</span></label>';
    }

    function addSite() {
      if (!adminActionsEnabled) return;
      sites.push({
        name: '',
        url: '',
        method: 'GET',
        timeout: 10000,
        retries: 0,
        retryDelayMs: 1000
      });
      renderSites();
      const rows = siteList.querySelectorAll('.site-row');
      const lastRow = rows[rows.length - 1];
      const urlInput = lastRow?.querySelector('[data-field="url"]');
      urlInput?.focus();
      setMessage('Site added locally. Save to apply.');
    }

    function removeSite(index) {
      if (!adminActionsEnabled) return;
      sites.splice(index, 1);
      renderSites();
      setAdminActionsEnabled(true);
      setMessage('Site removed locally. Save to apply.');
    }

    async function saveSites() {
      if (!adminActionsEnabled) return;
      try {
        adminPassword = passwordInput.value.trim() || adminPassword;
        const payload = collectSitesFromForm();
        const response = await fetch('/api/sites', {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(formatError(data, 'Failed to save sites'));
        sites = payload;
        setMessage('Sites saved.');
        await loadSites();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    function collectSitesFromForm() {
      const rows = Array.from(siteList.querySelectorAll('.site-row'));
      return rows.map(function (row) {
        const index = Number(row.dataset.index);
        const site = { ...(sites[index] || {}) };
        setString(site, row, 'name');
        setString(site, row, 'url');
        setString(site, row, 'method');
        setNumber(site, row, 'timeout');
        setNumber(site, row, 'maxLatencyMs');
        setNumber(site, row, 'retries');
        setNumber(site, row, 'retryDelayMs');
        setString(site, row, 'alertEmail');
        setString(site, row, 'expectedText');
        setString(site, row, 'expectedRegex');
        setString(site, row, 'body');
        setStatuses(site, row);
        site.paused = getField(row, 'paused').checked === true;
        if (getField(row, 'allowPrivateNetwork').checked) {
          site.allowPrivateNetwork = true;
        } else {
          delete site.allowPrivateNetwork;
        }
        return site;
      });
    }

    function getField(row, field) {
      return row.querySelector('[data-field="' + field + '"]');
    }

    function setString(site, row, field) {
      const value = getField(row, field).value.trim();
      if (value) {
        site[field] = value;
      } else {
        delete site[field];
      }
    }

    function setNumber(site, row, field) {
      const value = getField(row, field).value.trim();
      if (!value) {
        delete site[field];
        return;
      }
      const number = Number(value);
      site[field] = Number.isFinite(number) ? number : value;
    }

    function setStatuses(site, row) {
      const value = getField(row, 'expectedStatuses').value.trim();
      delete site.expectedStatus;
      if (!value) {
        delete site.expectedStatuses;
        return;
      }
      site.expectedStatuses = value.split(/[\\s,]+/).filter(Boolean).map(function (status) {
        const number = Number(status);
        return Number.isFinite(number) ? number : status;
      });
    }

    async function runChecks() {
      if (!adminActionsEnabled) return;
      await postCommand('/api/check', formatRunChecksResult);
    }

    async function cleanup() {
      if (!adminActionsEnabled) return;
      await postCommand('/api/cleanup', formatCleanupResult);
    }

    async function postCommand(path, formatSuccess) {
      try {
        const response = await fetch(path, { method: 'POST', headers: headers() });
        const data = await response.json();
        if (!response.ok) throw new Error(formatError(data, 'Command failed'));
        setCommandResult(formatSuccess(data));
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    function setCommandResult(text) {
      message.style.color = '';
      message.innerHTML = '<span class="command-result">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>' +
        '<span>' + escapeText(text) + '</span>' +
      '</span>';
    }

    function formatRunChecksResult(data) {
      const checked = Number(data?.checked || 0);
      const label = checked === 1 ? 'site' : 'sites';
      return 'Checks completed for ' + checked + ' ' + label + '.';
    }

    function formatCleanupResult(data) {
      return data?.message || 'Cleanup completed.';
    }

    function formatStatuses(site) {
      const statuses = site.expectedStatuses ?? site.expectedStatus;
      if (statuses === undefined) return '';
      return (Array.isArray(statuses) ? statuses : [statuses]).join(', ');
    }

    function numericValue(value) {
      return value === undefined || value === null ? '' : String(value);
    }

    function formatError(data, fallback) {
      if (!data) return fallback;
      const details = Array.isArray(data.details) && data.details.length > 0
        ? ': ' + data.details.join(', ')
        : '';
      return (data.error || fallback) + details;
    }

    function formatLoadSitesError(error) {
      if (error.status === 401) {
        return adminPassword ? 'Invalid admin password.' : 'Enter the admin password to manage sites.';
      }
      if (error.status === 429) return error.message || 'Too many admin sign-in attempts. Try again later.';
      return error.message;
    }

    function updateAdminAuthState(isUnlocked) {
      unlockAdminButton.textContent = isUnlocked ? 'Unlocked' : 'Unlock';
      unlockAdminButton.disabled = isUnlocked;
      passwordInput.disabled = isUnlocked;
    }

    function escapeAttr(value) {
      return escapeText(value).replace(/"/g, '&quot;');
    }

    function escapeText(value) {
      return String(value ?? '').replace(/[&<>"']/g, function (char) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[char];
      });
    }
  </script>
</body>
</html>`;
}
