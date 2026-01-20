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

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url)

    if (url.pathname === "/") {
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      })
    }

    if (url.pathname.startsWith("/dist/")) {
      const file = Bun.file(`.${url.pathname}`)
      if (await file.exists()) {
        return new Response(file, {
          headers: { "Content-Type": "application/javascript" },
        })
      }
    }

    return new Response("Not found", { status: 404 })
  },
})

console.log("Test server running on http://localhost:3000")
