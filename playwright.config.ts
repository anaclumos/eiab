import { defineConfig, devices } from "@playwright/test"

// lefthook's pre-push hook runs this suite on the owner's machine, so it uses
// the installed Google Chrome. No server listens on the base URL: each browser
// test's context answers its own requests (e2e/test-page.ts).
const BASE_URL = "http://localhost:3917/"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: true,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
})
