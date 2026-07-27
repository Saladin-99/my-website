import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

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

export default defineConfig({
  plugins: [r3fTimerCompatibility(), react()],
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
