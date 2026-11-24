import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

// The end-to-end tests keep their local data (D1 and the rest) in a folder of
// their own, which they empty before each run. Without it, the default
// .wrangler/state that `just dev` uses.
const stateDir = process.env.E2E_STATE_DIR;

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
      persistState: stateDir ? { path: stateDir } : true,
    }),
    reactRouter(),
  ],
  build: {
    // All CSS goes into one stylesheet, which the root route links. A move
    // between pages then never adds or removes a stylesheet, so a page is
    // never painted before its styles apply. The order of rules in the file
    // doesn't matter, because of the layers declared in root.tsx. See
    // openspec/specs/site-layout.
    cssCodeSplit: false,
  },
});
