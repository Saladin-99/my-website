import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { portfolioConfig } from "./src/portfolio.config.js";

const r3fThreeShimId = "\0r3f-three-timer-shim";
const timerClockPath = fileURLToPath(
  new URL("./src/vendor/ThreeTimerClock.js", import.meta.url),
);

function r3fTimerCompatibility() {
  return {
    name: "r3f-three-timer-compatibility",
    enforce: "pre",
    resolveId(source, importer) {
      if (
        source === "three" &&
        importer?.replaceAll("\\", "/").includes("/@react-three/fiber/")
      ) {
        return r3fThreeShimId;
      }

      return null;
    },
    load(id) {
      if (id !== r3fThreeShimId) return null;

      return `
        export * from "three";
        export { ThreeTimerClock as Clock } from ${JSON.stringify(timerClockPath)};
      `;
    },
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function normalizeBase(base) {
  const prefixed = base.startsWith("/") ? base : `/${base}`;
  return prefixed.endsWith("/") ? prefixed : `${prefixed}/`;
}

function createManifest(base) {
  const {
    assets,
    site,
  } = portfolioConfig;
  const resolvedBase = normalizeBase(base);

  return {
    id: resolvedBase,
    name: site.pwa.name,
    short_name: site.pwa.shortName,
    description: site.description,
    start_url: resolvedBase,
    scope: resolvedBase,
    display: site.pwa.display,
    orientation: site.pwa.orientation,
    background_color: site.backgroundColor,
    theme_color: site.themeColor,
    categories: site.pwa.categories,
    icons: [
      {
        src: `${resolvedBase}icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${resolvedBase}icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: portfolioConfig.applications.resume.title,
        short_name: portfolioConfig.applications.resume.label,
        description: portfolioConfig.destinations.resume.mobileDescription,
        url: `${resolvedBase}${assets.resumePdf}`,
        icons: [
          {
            src: `${resolvedBase}icon-192.png`,
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}

function portfolioSiteMetadata() {
  let base = "/";

  const manifestSource = () =>
    `${JSON.stringify(createManifest(base), null, 2)}\n`;

  return {
    name: "portfolio-site-metadata",
    configResolved(config) {
      base = normalizeBase(config.base || "/");
    },
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        const {
          site,
        } = portfolioConfig;
        const socialImageUrl = new URL(
          site.socialImage.path,
          site.url,
        ).href;
        const replacements = {
          "%PORTFOLIO_LANG%": site.lang,
          "%PORTFOLIO_TITLE%": site.title,
          "%PORTFOLIO_DESCRIPTION%": site.description,
          "%PORTFOLIO_AUTHOR%": site.author,
          "%PORTFOLIO_ROBOTS%": site.robots,
          "%PORTFOLIO_COLOR_SCHEME%": site.colorScheme,
          "%PORTFOLIO_REFERRER%": site.referrerPolicy,
          "%PORTFOLIO_THEME_COLOR%": site.themeColor,
          "%PORTFOLIO_URL%": site.url,
          "%PORTFOLIO_SITE_NAME%": site.pwa.shortName,
          "%PORTFOLIO_LOCALE%": site.locale,
          "%PORTFOLIO_SOCIAL_IMAGE%": socialImageUrl,
          "%PORTFOLIO_SOCIAL_IMAGE_TYPE%": site.socialImage.type,
          "%PORTFOLIO_SOCIAL_IMAGE_WIDTH%": site.socialImage.width,
          "%PORTFOLIO_SOCIAL_IMAGE_HEIGHT%": site.socialImage.height,
          "%PORTFOLIO_SOCIAL_IMAGE_ALT%": site.socialImage.alt,
          "%PORTFOLIO_BASE%": base,
        };

        return Object.entries(replacements).reduce(
          (result, [token, value]) =>
            result.replaceAll(token, escapeHtml(value)),
          html,
        );
      },
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split("?")[0];
        const manifestPath = `${base}site.webmanifest`.replace(
          /\/+/g,
          "/",
        );
        if (
          pathname !== manifestPath &&
          pathname !== "/site.webmanifest"
        ) {
          next();
          return;
        }

        response.statusCode = 200;
        response.setHeader(
          "Content-Type",
          "application/manifest+json; charset=utf-8",
        );
        response.setHeader("Cache-Control", "no-cache");
        response.end(manifestSource());
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "site.webmanifest",
        source: manifestSource(),
      });
      this.emitFile({
        type: "asset",
        fileName: "CNAME",
        source: `${new URL(portfolioConfig.site.url).hostname}\n`,
      });
    },
  };
}

export default defineConfig({
  plugins: [
    portfolioSiteMetadata(),
    r3fTimerCompatibility(),
    react(),
  ],
  optimizeDeps: {
    // Keep Fiber out of esbuild's opaque prebundle so its `three` import
    // consistently passes through the Timer compatibility resolver in dev.
    exclude: ["@react-three/fiber"],
    // Fiber's ESM graph still reaches these CommonJS compatibility entries.
    // Prebundle them so Vite can provide their expected default exports.
    include: [
      "scheduler",
      "use-sync-external-store/shim/with-selector.js",
    ],
  },
  build: {
    // Three.js is isolated in an optional lazy chunk and never blocks the hero.
    chunkSizeWarningLimit: 950,
  },
});
