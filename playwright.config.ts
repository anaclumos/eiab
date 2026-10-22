import { defineConfig, devices } from "@playwright/test"

// lefthook's pre-push hook runs this suite on the owner's machine, so it uses
// the installed Google Chrome and a port no dev server is likely to hold.
const PORT = 3917
const BASE_URL = `http://localhost:${PORT}/`

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
  webServer: {
    command: "bun run e2e/test-server.ts",
    url: BASE_URL,
    env: { PORT: String(PORT) },
    reuseExistingServer: false,
  },
})
