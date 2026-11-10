import { join } from "node:path";

import { defineConfig } from "vite";

const root = join(import.meta.dirname, "harness");

// The pages the editor's and the sheet view's Playwright tests run against
// (harness/). Separate from vite.config.ts, without the React Router and
// Cloudflare plugins, so they never end up in the deployed app.
export default defineConfig({
  root,
  build: {
    outDir: join(import.meta.dirname, "dist/harness"),
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        editor: join(root, "index.html"),
        "sheet-view": join(root, "sheet-view.html"),
      },
    },
  },
});
