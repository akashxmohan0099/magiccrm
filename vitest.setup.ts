// Global vitest setup. Loaded once per worker.
//
// `@testing-library/jest-dom` extends vitest's `expect` with DOM matchers
// (`toBeInTheDocument`, `toHaveAttribute`, …). The `cleanup` import below
// unmounts every component rendered by `render()` after each test so the
// next test gets a fresh document body — RTL auto-cleanup only fires under
// jest, not vitest, so we wire it explicitly.
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
