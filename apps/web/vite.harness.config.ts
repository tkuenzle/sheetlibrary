import { join } from "node:path";

import { defineConfig } from "vite";

// The page the editor's Playwright tests run against (harness/). Separate from
// vite.config.ts, without the React Router and Cloudflare plugins, so it never
// ends up in the deployed app.
export default defineConfig({
  root: join(import.meta.dirname, "harness"),
  build: {
    outDir: join(import.meta.dirname, "dist/harness"),
    emptyOutDir: true,
  },
});
