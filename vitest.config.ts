import { defineConfig } from "vitest/config";
import path from "path";

// jsdom by default so component tests (`*.test.tsx`) can mount React via
// @testing-library/react. Pure-helper tests work under jsdom too — the
// startup cost is negligible at this test count and the alternative
// (per-file env annotations) leaks setup detail into every component test.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
