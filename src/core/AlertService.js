/**
 * Alert service for sending notifications
 */
export class AlertService {
  constructor(configManager) {
    this.config = configManager;
  }

  async sendAlert(site, domain, failureData, consecutiveFailures) {
    if (!this.config.hasAlerts()) return;

    const brevoKey = this.config.getBrevoApiKey();
    if (!brevoKey) return;

    const alertTo = site.alertEmail || this.config.getAlertToEmail();

    if (!alertTo) {
      console.warn("No alert email configured, skipping email alert");
      return;
    }

    const emailData = {
      sender: {
        name: this.config.getAlertFromName(),
        email: this.config.getAlertFromEmail(),
      },
      to: [
        {
          email: alertTo,
          name: alertTo.split("@")[0],
        },
      ],
      subject: `🚨 Alert: ${domain} is DOWN`,
      htmlContent: this.generateEmailTemplate(site, domain, failureData, consecutiveFailures),
    };

    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "api-key": brevoKey,
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Brevo API error:", error);
      }
    } catch (error) {
      console.error("Failed to send alert email:", error);
    }
  }

  generateEmailTemplate(site, domain, failureData, consecutiveFailures) {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #cc0000; margin-top: 0;">⚠️ Site Down Alert</h1>

            <div style="background: #fff3f3; padding: 20px; border-left: 4px solid #cc0000; border-radius: 4px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #333;">${domain}</h2>
              <p><strong>URL:</strong> ${site.url}</p>
              <p><strong>Status:</strong> ${failureData.status || "Connection Failed"}</p>
              <p><strong>Error:</strong> ${failureData.message}</p>
              <p><strong>Response Time:</strong> ${failureData.duration}ms</p>
              <p><strong>Consecutive Failures:</strong> ${consecutiveFailures}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <p style="color: #666;">This alert was triggered after ${consecutiveFailures} consecutive failed health checks.</p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="font-size: 12px; color: #999;">
                MikroAPM
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
