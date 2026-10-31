import { defineConfig, devices } from "@playwright/test";

import {
  appPort,
  appURL,
  devPort,
  devURL,
  harnessPort,
  harnessURL,
} from "./e2e/servers";

// The page tests run against the production build, served by the Workers
// runtime via `vite preview`. Build first (`just build`); `just check` does
// this in the right order. The editor tests run against the harness
// (harness/), which is built here and never deployed. The design page only
// exists in previews and the dev server, so its tests run on the dev server.
// Sign-in needs a secret. The servers read it from the environment, so the
// tests don't depend on a local .dev.vars.
const env = {
  BETTER_AUTH_SECRET: "a-secret-for-end-to-end-tests-only-0123456789",
};

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: appURL,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Phone layout and touch in Chromium. Not a real phone keyboard.
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: `pnpm preview --port ${String(appPort)} --strictPort`,
      url: appURL,
      env,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm exec vite build --config vite.harness.config.ts && pnpm exec vite preview --config vite.harness.config.ts --port ${String(harnessPort)} --strictPort`,
      url: harnessURL,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm dev --port ${String(devPort)} --strictPort`,
      url: devURL,
      env,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
