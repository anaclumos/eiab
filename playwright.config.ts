import { existsSync, readdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { defineConfig, devices } from "@playwright/test"

const PORT = 3917
const BASE_URL = `http://localhost:${PORT}/`

const BROWSERS = join(homedir(), ".agent-browser", "browsers")
const VERSION_DIRECTORY = /^chrome-\d+(\.\d+)*$/
const EXECUTABLE: Record<string, string | undefined> = {
  darwin:
    "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
  linux: "chrome-linux64/chrome",
}

const agentBrowserChrome = () => {
  const newest = (existsSync(BROWSERS) ? readdirSync(BROWSERS) : [])
    .filter((name) => VERSION_DIRECTORY.test(name))
    .sort((a, b) => b.localeCompare(a, "en", { numeric: true }))[0]
  const executable = EXECUTABLE[process.platform]
  const path = newest && executable && join(BROWSERS, newest, executable)
  if (!(path && existsSync(path))) {
    throw new Error(
      `No agent-browser Chrome for Testing under ${BROWSERS}; run \`agent-browser install\``
    )
  }
  return path
}

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
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath: agentBrowserChrome() },
      },
    },
  ],
  webServer: {
    command: "bun run e2e/test-server.ts",
    url: BASE_URL,
    env: { PORT: String(PORT) },
    reuseExistingServer: false,
  },
})
