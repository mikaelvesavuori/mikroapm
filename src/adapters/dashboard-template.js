/**
 * Dashboard HTML template
 */
export function getDashboardHTML() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Uptime Monitor</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://rsms.me/">
  <link rel="stylesheet" href="https://rsms.me/inter/inter.css">
  <style>
    :root {
      --spacing-unit: 8px;
      --color-bg: #fff;
      --color-text: #202020;
      --color-text-secondary: #8d8d8d;
      --color-border: #e0e0e0;
      --color-accent: #3e63dd;
      --color-accent-light: #edf2fe;
      --color-card-bg: #fff;
      --color-overlay: #f9fafb;
      --color-shadow: rgb(0 0 0 / 8%);
      --color-shadow-hover: rgb(0 0 0 / 12%);
      --color-success: #30a46c;
      --color-success-light: #ddf3e4;
      --color-warning: #f76b15;
      --color-warning-light: #ffe8d7;
      --color-error: #e5484d;
      --color-error-light: #ffe5e5;
    }

    @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) {
        --color-bg: #111;
        --color-text: #eee;
        --color-text-secondary: #b4b4b4;
        --color-border: #313131;
        --color-accent-light: #182449;
        --color-card-bg: #18191b;
        --color-overlay: #1f2023;
        --color-shadow: rgb(0 0 0 / 30%);
        --color-shadow-hover: rgb(0 0 0 / 50%);
        --color-success-light: #0d3a24;
        --color-warning-light: #3d1c0a;
        --color-error-light: #3d1319;
      }
    }

    [data-theme="dark"] {
      --color-bg: #111;
      --color-text: #eee;
      --color-text-secondary: #b4b4b4;
      --color-border: #313131;
      --color-accent-light: #182449;
      --color-card-bg: #18191b;
      --color-overlay: #1f2023;
      --color-shadow: rgb(0 0 0 / 30%);
      --color-shadow-hover: rgb(0 0 0 / 50%);
      --color-success-light: #0d3a24;
      --color-warning-light: #3d1c0a;
      --color-error-light: #3d1319;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: var(--color-text);
      background: var(--color-bg);
      -webkit-font-smoothing: antialiased;
    }

    body::before {
      content: '';
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100vh;
      background: linear-gradient(135deg, var(--color-accent-light) 0%, transparent 35%);
      z-index: -1;
      pointer-events: none;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: calc(var(--spacing-unit) * 6) calc(var(--spacing-unit) * 3);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: calc(var(--spacing-unit) * 6);
    }

    .header h1 {
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .header-actions {
      display: flex;
      gap: calc(var(--spacing-unit) * 1.5);
    }

    .icon-button {
      padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 2);
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s;
      box-shadow: 0 1px 2px var(--color-shadow);
      color: var(--color-text);
    }

    .icon-button:hover {
      background: var(--color-overlay);
      box-shadow: 0 2px 4px var(--color-shadow-hover);
      transform: none;
    }

    .icon-button:active {
      transform: scale(0.95);
    }

    .card {
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: calc(var(--spacing-unit) * 3);
      margin-bottom: calc(var(--spacing-unit) * 3);
      box-shadow: 0 1px 2px var(--color-shadow);
    }

    .input-group {
      display: grid;
      grid-template-columns: 1fr auto auto auto;
      gap: calc(var(--spacing-unit) * 1.5);
    }

    input, select {
      padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 2);
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text);
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s;
    }

    input:focus, select:focus {
      outline: none;
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px var(--color-accent-light);
    }

    button {
      padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 3);
      background: var(--color-accent);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      font-family: inherit;
      transition: all 0.2s;
      box-shadow: 0 1px 2px var(--color-shadow);
    }

    button:hover {
      background: #3451b2;
      box-shadow: 0 2px 4px var(--color-shadow-hover);
      transform: translateY(-1px);
    }

    .uptime-card {
      padding: calc(var(--spacing-unit) * 5);
      border-radius: 12px;
      text-align: center;
      margin-bottom: calc(var(--spacing-unit) * 3);
      background: var(--color-success-light);
      border: 1px solid var(--color-success);
    }

    .uptime-card.degraded {
      background: var(--color-warning-light);
      border-color: var(--color-warning);
    }

    .uptime-card.down {
      background: var(--color-error-light);
      border-color: var(--color-error);
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
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .status-badge.success { background: var(--color-success); color: white; }
    .status-badge.degraded { background: var(--color-warning); color: white; }
    .status-badge.down { background: var(--color-error); color: white; }
    .uptime {
      font-size: 56px;
      font-weight: 700;
      margin: calc(var(--spacing-unit) * 2) 0;
      line-height: 1;
      letter-spacing: -0.02em;
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
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.02em;
    }

    .stat-label {
      font-size: 13px;
      color: var(--color-text-secondary);
      margin-top: calc(var(--spacing-unit));
      text-transform: uppercase;
      letter-spacing: 0.05em;
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
      transition: all 0.2s;
      min-height: 8px;
    }

    .day-bar:hover {
      transform: translateY(-2px);
      opacity: 0.8;
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
        #e0e0e0,
        #e0e0e0 4px,
        #f5f5f5 4px,
        #f5f5f5 8px
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
      box-shadow: 0 4px 12px var(--color-shadow);
      border: 1px solid var(--color-border);
    }

    .day-bar:hover .day-bar-tooltip { display: block; }

    .day-failures {
      background: var(--color-overlay);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: calc(var(--spacing-unit) * 2);
      margin-top: calc(var(--spacing-unit) * 2);
    }

    .day-failures-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: calc(var(--spacing-unit) * 2);
      padding-bottom: calc(var(--spacing-unit) * 2);
      border-bottom: 1px solid var(--color-border);
    }

    .day-failures-header h4 {
      font-size: 14px;
      font-weight: 600;
    }

    .close-btn {
      background: transparent;
      border: 1px solid var(--color-border);
      padding: 6px 12px;
      font-size: 12px;
      color: var(--color-text-secondary);
    }

    .close-btn:hover {
      background: var(--color-card-bg);
      color: var(--color-text);
      transform: none;
    }

    .failure {
      padding: calc(var(--spacing-unit) * 2);
      margin: calc(var(--spacing-unit) * 1.5) 0;
      background: var(--color-card-bg);
      border-left: 3px solid var(--color-error);
      border-radius: 6px;
      transition: all 0.2s;
    }

    .failure:hover { transform: translateX(4px); }

    .time {
      color: var(--color-text-secondary);
      font-size: 12px;
      margin-bottom: calc(var(--spacing-unit));
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
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
      letter-spacing: 0.05em;
    }

    .failure-detail span {
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
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

    @media (max-width: 768px) {
      .input-group { grid-template-columns: 1fr; }
      .stats { grid-template-columns: 1fr; }
      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: calc(var(--spacing-unit) * 2);
      }
      .header-actions {
        width: 100%;
        justify-content: flex-end;
      }
      .failure-details { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Uptime Monitor</h1>
      <div class="header-actions">
        <button class="icon-button" onclick="refreshData()" aria-label="Refresh data">
          <span>↻</span>
        </button>
        <button class="icon-button" onclick="toggleTheme()" aria-label="Toggle theme">
          <span id="theme-icon">☾</span>
        </button>
      </div>
    </div>

    <div class="card">
      <div class="input-group">
        <input type="text" id="domain" placeholder="Enter domain (e.g., example.com)" />
        <select id="days">
          <option value="7">7 days</option>
          <option value="30" selected>30 days</option>
          <option value="90">90 days</option>
        </select>
        <select id="timezone">
          <option value="local">Local Time</option>
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern</option>
          <option value="America/Chicago">Central</option>
          <option value="America/Denver">Mountain</option>
          <option value="America/Los_Angeles">Pacific</option>
          <option value="Europe/London">London</option>
          <option value="Europe/Paris">Paris</option>
          <option value="Asia/Tokyo">Tokyo</option>
          <option value="Asia/Shanghai">Shanghai</option>
          <option value="Australia/Sydney">Sydney</option>
        </select>
        <button onclick="checkUptime()">Check</button>
      </div>
    </div>

    <div id="result"></div>
  </div>

  <script>
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
      document.getElementById('theme-icon').textContent = theme === 'dark' ? '☀' : '☾';
    }

    function refreshData() {
      if (currentDomain) {
        checkUptime();
      }
    }

    function getTimezone() {
      const tz = document.getElementById('timezone').value;
      return tz === 'local' ? Intl.DateTimeFormat().resolvedOptions().timeZone : tz;
    }

    function formatDateTime(timestamp, timezone) {
      const options = {
        timeZone: timezone,
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      };
      return new Intl.DateTimeFormat('en-US', options).format(new Date(timestamp));
    }

    let currentData = null;
    let currentDomain = null;

    async function checkUptime() {
      const domain = document.getElementById('domain').value.trim();
      const days = document.getElementById('days').value;
      if (!domain) return;

      currentDomain = domain;

      // Update URL for bookmarking
      const url = new URL(window.location);
      url.pathname = '/' + domain;
      url.searchParams.set('days', days);
      window.history.pushState({}, '', url);

      const result = document.getElementById('result');
      result.innerHTML = '<div class="card loading">Loading data...</div>';

      try {
        const response = await fetch(\`/api/uptime/\${domain}?days=\${days}\`);
        const data = await response.json();
        currentData = data;
        renderUptimeData(data);
      } catch (error) {
        result.innerHTML = \`<div class="card" style="color: var(--color-error);">Error: \${error.message}</div>\`;
      }
    }

    function renderUptimeData(data) {
      const uptimeValue = data.uptime === 'N/A' ? null : parseFloat(data.uptime);
      let cardClass = 'uptime-card';
      let statusBadgeClass = 'status-badge success';
      let statusText = 'Operational';

      if (uptimeValue === null) {
        statusBadgeClass = 'status-badge';
        statusText = 'No Data';
      } else if (uptimeValue < 99.9) {
        cardClass += ' degraded';
        statusBadgeClass = 'status-badge degraded';
        statusText = 'Degraded';
      }
      if (uptimeValue !== null && uptimeValue < 95) {
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
        const response = await fetch(\`/api/failures/\${currentDomain}/\${date}\`);
        const data = await response.json();
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
              <button class="close-btn" onclick="closeDayFailures()">Close</button>
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
            <button class="close-btn" onclick="closeDayFailures()">Close</button>
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
      const domain = path.substring(1); // Remove leading /

      if (domain && domain !== '') {
        document.getElementById('domain').value = domain;

        // Set days from query param if present
        const days = params.get('days');
        if (days) {
          document.getElementById('days').value = days;
        }

        // Auto-load the data
        checkUptime();
      }
    }

    initTheme();
    initFromURL();
  </script>
</body>
</html>`;
}
