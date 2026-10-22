import { existsSync } from "node:fs"
import { join, resolve } from "node:path"
import { test as base } from "@playwright/test"

const PACKAGE_DIR = resolve(__dirname, "../packages/eiab")

const html = `<!DOCTYPE html>
<html>
<head>
  <title>EIAB Test Page</title>
</head>
<body>
  <div id="root">
    <div data-testid="status">loading</div>
    <div data-testid="success" style="display:none">Not in an in-app browser</div>
    <div data-testid="failed" style="display:none">In an in-app browser</div>
  </div>
  <script type="module">
    import { isInAppBrowser } from "/dist/index.js";

    const inApp = isInAppBrowser();
    
    document.querySelector('[data-testid="status"]').textContent = inApp ? "in-app" : "normal";
    
    if (inApp) {
      document.querySelector('[data-testid="failed"]').style.display = "block";
    } else {
      document.querySelector('[data-testid="success"]').style.display = "block";
    }
  </script>
</body>
</html>`

// Each test's browser context answers every request itself, so loading the
// page opens no socket. Under heavy host load, Chrome's loopback connection to
// a local test server was closed before it sent the request
// (net::ERR_SOCKET_NOT_CONNECTED) or never connected
// (net::ERR_CONNECTION_TIMED_OUT), whichever server answered.
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route("**/*", (route) => {
      const { pathname } = new URL(route.request().url())
      if (pathname === "/") {
        return route.fulfill({ contentType: "text/html", body: html })
      }
      const file = join(PACKAGE_DIR, pathname)
      if (pathname.startsWith("/dist/") && existsSync(file)) {
        return route.fulfill({
          path: file,
          contentType: "application/javascript",
        })
      }
      return route.fulfill({ status: 404, body: "Not found" })
    })
    await use(context)
  },
})
