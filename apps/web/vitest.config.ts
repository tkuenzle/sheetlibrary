import { defineConfig } from "vitest/config";

// Separate from vite.config.ts: the React Router and Cloudflare plugins don't run under Vitest.
export default defineConfig({
  test: {
    include: ["app/**/*.test.{ts,tsx}"],
  },
});
