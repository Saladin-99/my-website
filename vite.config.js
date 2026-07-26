import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Three.js is isolated in an optional lazy chunk and never blocks the hero.
    chunkSizeWarningLimit: 950,
  },
});
