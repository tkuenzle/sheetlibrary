import { availableParallelism } from "node:os";

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
// Sign-in needs a secret, and photo import uses the fake model. The servers
// read both from the environment, so the tests don't depend on a local
// .dev.vars.
const env = {
  BETTER_AUTH_SECRET: "a-secret-for-end-to-end-tests-only-0123456789",
  PHOTO_MODEL: "fake",
};

// Where the app server and the dev server keep their local data during a
// run (E2E_STATE_DIR, read by vite.config.ts).
const stateDir = ".wrangler/e2e-state";

// When the run started. Set once here, in the main process, and inherited by
// the workers, which load this file again. e2e/fixtures.spec.ts checks that
// the accounts are newer.
process.env.E2E_RUN_STARTED ??= new Date().toISOString();
const devStateDir = ".wrangler/e2e-dev-state";

// The tag of tests that run alone, in the timing projects below.
const timing = /@timing/;

// Applies the migrations to the local D1 in `dir`. --config: after a build,
// wrangler reads the build output's config, which has no migrations folder.
function migrate(dir: string) {
  return `CI=true pnpm exec wrangler d1 migrations apply DB --local --persist-to ${dir} --config wrangler.jsonc`;
}

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  // Playwright's default, at most 7. Each worker slot signs in once per run
  // (e2e/fixtures.ts), and sign-in emails are limited to 10 per visitor per
  // hour. 7 slots, the test that signs in a new account, and the one that
  // signs in a second account make 9, which leaves one to spare.
  workers: Math.min(7, Math.max(1, Math.floor(availableParallelism() / 2))),
  retries: process.env.CI ? 1 : 0,
  // A test that passes only on its retry fails the run, so a retry doesn't
  // hide it. The retry still leaves its trace.
  failOnFlakyTests: !!process.env.CI,
  // In CI, results.json also lists the flaky and failed tests for the run's
  // summary (.github/workflows/ci.yml).
  reporter: process.env.CI
    ? [["github"], ["json", { outputFile: "test-results/results.json" }]]
    : "list",
  use: {
    baseURL: appURL,
    // A trace of each retried test, and a screenshot of each failure, in
    // test-results. CI uploads that folder.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      grepInvert: timing,
    },
    // Phone layout and touch in Chromium. Not a real phone keyboard.
    {
      name: "phone",
      use: { ...devices["Pixel 7"] },
      grepInvert: timing,
    },
    // Tests tagged @timing need data within the app's set wait (150ms for a
    // page, 200ms for a dialog). A busy machine misses it, so they run once
    // every other test has finished, one at a time.
    {
      name: "timing-chromium",
      use: { ...devices["Desktop Chrome"] },
      grep: timing,
      workers: 1,
      dependencies: ["chromium", "phone"],
    },
    {
      name: "timing-phone",
      use: { ...devices["Pixel 7"] },
      grep: timing,
      workers: 1,
      dependencies: ["timing-chromium"],
    },
  ],
  webServer: [
    {
      // The build copies the secrets from a local .dev.vars. With that file
      // there, the server ignores `env`, and PHOTO_MODEL would be "claude".
      // Each run starts with an empty database of its own, away from the one
      // `just dev` uses. It's emptied here because Playwright starts its
      // servers before any global setup. Never reused: a server left running
      // would keep the last run's data, or another worktree's build.
      command: [
        `rm -rf build/server/.dev.vars ${stateDir}`,
        migrate(stateDir),
        `pnpm preview --port ${String(appPort)} --strictPort`,
      ].join(" && "),
      url: appURL,
      env: { ...env, E2E_STATE_DIR: stateDir },
      reuseExistingServer: false,
    },
    {
      command: `pnpm exec vite build --config vite.harness.config.ts && pnpm exec vite preview --config vite.harness.config.ts --port ${String(harnessPort)} --strictPort`,
      url: harnessURL,
      // Never reused: a server left running could be another worktree's.
      reuseExistingServer: false,
    },
    {
      // For the design page. The root still asks who is signed in, so this
      // server gets an empty database of its own too, off the one `just dev`
      // uses.
      command: [
        `rm -rf ${devStateDir}`,
        migrate(devStateDir),
        `pnpm dev --port ${String(devPort)} --strictPort`,
      ].join(" && "),
      url: devURL,
      env: { ...env, E2E_STATE_DIR: devStateDir },
      reuseExistingServer: false,
    },
  ],
});
