import { portfolioConfig } from "./portfolio.config";

const cursorAssetUrls = import.meta.glob(
  "./assets/cursors/*.svg",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
);

export function publicAsset(path) {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${String(path).replace(/^\/+/, "")}`;
}

export function createPortfolioCursorStyle() {
  return Object.fromEntries(
    Object.entries(portfolioConfig.appearance.cursors).map(
      ([name, cursor]) => {
        const assetKey = `./assets/${String(cursor.asset).replace(
          /^\/+/,
          "",
        )}`;
        const assetUrl = cursorAssetUrls[assetKey];
        const hotspot = cursor.hotspot
          .map((coordinate) => Number(coordinate))
          .join(" ");
        const variableName = name.replace(
          /[A-Z]/g,
          (letter) => `-${letter.toLowerCase()}`,
        );

        if (!assetUrl) {
          throw new Error(
            `Cursor asset "${cursor.asset}" is not available.`,
          );
        }

        return [
          `--cursor-${variableName}`,
          `url("${assetUrl}") ${hotspot}`,
        ];
      },
    ),
  );
}

export function formatPortfolioCopy(template, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) =>
      result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function getPortfolioLayoutMode() {
  const { layout } = portfolioConfig.behavior;
  const phoneLikeLandscape =
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(hover: none)").matches &&
    Math.min(window.innerWidth, window.innerHeight) <=
      layout.phoneLandscapeShortSide;

  if (
    window.matchMedia("(orientation: portrait)").matches ||
    window.innerWidth <= layout.mobileMaxWidth ||
    phoneLikeLandscape
  ) {
    return "mobile";
  }

  return window.innerWidth <= layout.tabletMaxWidth
    ? "tablet"
    : "desktop";
}

export function createPortfolioDestinations() {
  const { destinations, resume, assets } = portfolioConfig;
  const resumeUrl = publicAsset(assets.resumePdf);

  return {
    github: destinations.github,
    resume: {
      ...destinations.resume,
      label: resume.browserLabel,
      url: resumeUrl,
    },
    resumeUrl,
  };
}
