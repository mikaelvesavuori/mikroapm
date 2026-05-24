// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://mikrosuite.com",
  base: "/apm/docs",
  integrations: [
    starlight({
      title: "MikroAPM Docs",
      description:
        "Self-hosted uptime monitoring with health checks, incident records, alerts, and a public status dashboard.",
      favicon: "/favicon.svg",
      customCss: ["./src/styles/custom.css"],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/mikaelvesavuori/mikroapm",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "What is MikroAPM?", link: "/getting-started/intro" },
            { label: "Installation", link: "/getting-started/installation" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "Configuration", link: "/guides/configuration" },
            { label: "Deployment", link: "/guides/deployment" },
            { label: "Alerts", link: "/guides/alerts" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "Comparison", link: "/reference/comparison" },
            { label: "API Reference", link: "/reference/api" },
            { label: "Architecture", link: "/reference/architecture" },
          ],
        },
      ],
    }),
  ],
});
