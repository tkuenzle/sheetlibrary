import { defineConfig, devices } from "@playwright/test";

const port = 4173;

// Runs against the production build, served by the Workers runtime via `vite preview`.
// Build first (`just build`); `just check` does this in the right order.
export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${String(port)}`,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Phone layout and touch in Chromium. Not a real phone keyboard.
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `pnpm preview --port ${String(port)} --strictPort`,
    url: `http://localhost:${String(port)}`,
    reuseExistingServer: !process.env.CI,
  },
});
