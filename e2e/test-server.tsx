import { renderToString } from "react-dom/server"
import { EiabFailed, EiabSuccess, EscapeInAppBrowser } from "../src/react"

function TestPage() {
  return (
    <html>
      <head>
        <title>EIAB Test Page</title>
      </head>
      <body>
        <div id="root">
          <EiabSuccess>
            <div data-testid="success">Not in an in-app browser</div>
          </EiabSuccess>
          <EiabFailed>
            <div data-testid="failed">In an in-app browser</div>
          </EiabFailed>
          <EscapeInAppBrowser />
        </div>
        <script src="/client.js" type="module" />
      </body>
    </html>
  )
}

const clientScript = `
import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { EscapeInAppBrowser, EiabSuccess, EiabFailed } from "../dist/react.js";

function TestPage() {
  return createElement("div", null, [
    createElement(EiabSuccess, { key: "success" },
      createElement("div", { "data-testid": "success" }, "Not in an in-app browser")
    ),
    createElement(EiabFailed, { key: "failed" },
      createElement("div", { "data-testid": "failed" }, "In an in-app browser")
    ),
    createElement(EscapeInAppBrowser, { key: "escape" })
  ]);
}

hydrateRoot(document.getElementById("root"), createElement(TestPage));
`

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url)

    if (url.pathname === "/") {
      const html = renderToString(<TestPage />)
      return new Response(`<!DOCTYPE html>${html}`, {
        headers: { "Content-Type": "text/html" },
      })
    }

    if (url.pathname === "/client.js") {
      return new Response(clientScript, {
        headers: { "Content-Type": "application/javascript" },
      })
    }

    return new Response("Not found", { status: 404 })
  },
})

console.log("Test server running on http://localhost:3000")
