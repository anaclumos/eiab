import { toXSafariUrl } from "eiab"

function httpUrl(raw: string): URL | null {
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function GET(request: Request): Response {
  const requestUrl = new URL(request.url)
  const target = requestUrl.searchParams.get("url")
  if (!target) {
    return new Response("missing url", { status: 400 })
  }

  const parsed = httpUrl(target)
  if (!parsed) {
    return new Response("bad url", { status: 400 })
  }

  const safari = toXSafariUrl(parsed.toString())
  if (!safari) {
    return new Response("unsupported", { status: 400 })
  }

  const back = requestUrl.origin
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${safari}">
  <title>Opening browser</title>
</head>
<body>
  <p>Opening browser…</p>
  <p><a href="${safari}">Continue</a> · <a href="${back}">Back</a></p>
  <script>location.replace(${JSON.stringify(safari)})</script>
</body>
</html>`

  return new Response(html, {
    status: 302,
    headers: {
      Location: safari,
      "Content-Type": "text/html; charset=utf-8",
      Refresh: `0;url=${safari}`,
    },
  })
}

export const dynamic = "force-dynamic"
