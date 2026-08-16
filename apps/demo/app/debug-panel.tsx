"use client"

import { type EiabDebugInfo, getDebugInfo } from "eiab"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

interface LogEntry {
  t: number
  line: string
}

function copyButtonLabel(state: "idle" | "copied" | "select"): string {
  if (state === "copied") {
    return "Copied"
  }
  if (state === "select") {
    return "Select below"
  }
  return "Copy report"
}

function nowIso(): string {
  return new Date().toISOString()
}

function formatReport(info: EiabDebugInfo | null, events: LogEntry[]): string {
  const lines = ["=== eiab debug report ===", `copiedAt: ${nowIso()}`, ""]

  if (info) {
    lines.push(JSON.stringify(info, null, 2), "")
  } else {
    lines.push("(snapshot unavailable)", "")
  }

  lines.push("--- events ---")
  if (events.length === 0) {
    lines.push("(none)")
  } else {
    for (const event of events) {
      lines.push(`+${event.t}ms ${event.line}`)
    }
  }
  lines.push("")
  return lines.join("\n")
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.setAttribute("readonly", "")
      textarea.style.position = "fixed"
      textarea.style.left = "-9999px"
      document.body.appendChild(textarea)
      textarea.select()
      const ok = document.execCommand("copy")
      document.body.removeChild(textarea)
      return ok
    } catch {
      return false
    }
  }
}

function describeClick(event: Event): string | null {
  const target = event.target
  if (!(target instanceof Element)) {
    return null
  }

  const eiab = target.closest("[data-eiab]")
  const anchor = target.closest("a")
  if (!(eiab || anchor)) {
    return null
  }

  const el = (eiab ?? anchor) as HTMLElement
  const parts = [
    "click",
    eiab ? `data-eiab=${eiab.getAttribute("data-eiab")}` : null,
    `tag=${el.tagName.toLowerCase()}`,
    el instanceof HTMLAnchorElement || el.hasAttribute("href")
      ? `href=${el.getAttribute("href") ?? ""}`
      : null,
    `defaultPrevented=${event instanceof MouseEvent ? event.defaultPrevented : false}`,
  ]
  return parts.filter(Boolean).join(" ")
}

export function DebugPanel() {
  const [info, setInfo] = useState<EiabDebugInfo | null>(null)
  const [events, setEvents] = useState<LogEntry[]>([])
  const [copyState, setCopyState] = useState<"idle" | "copied" | "select">(
    "idle"
  )
  const originRef = useRef(0)
  const eventsRef = useRef<LogEntry[]>([])

  const log = useCallback((line: string) => {
    const entry = {
      t: Math.round(performance.now() - originRef.current),
      line,
    }
    eventsRef.current = [...eventsRef.current, entry]
    setEvents(eventsRef.current)
  }, [])

  const refreshSnapshot = useCallback((): EiabDebugInfo | null => {
    try {
      const next = getDebugInfo()
      setInfo(next)
      return next
    } catch (error) {
      log(
        `getDebugInfo failed: ${error instanceof Error ? error.message : error}`
      )
      return null
    }
  }, [log])

  useEffect(() => {
    originRef.current = performance.now()

    const stillOnPage = (ms: number) => {
      log(
        `still-on-page +${ms}ms href=${location.href} visibility=${document.visibilityState}`
      )
    }
    const timers = [
      window.setTimeout(() => {
        const snapshot = refreshSnapshot()
        log(
          `mount readyState=${document.readyState} href=${location.href} inApp=${snapshot?.isInAppBrowser ?? "?"} gesture=${snapshot?.needsUserGesture ?? "?"} escape=${snapshot?.escapeUrl ?? "null"}`
        )
      }, 0),
      ...[300, 1000, 3000].map((ms) =>
        window.setTimeout(() => stillOnPage(ms), ms)
      ),
    ]

    const onClick = (event: Event) => {
      const line = describeClick(event)
      if (!line) {
        return
      }
      log(line)
      window.setTimeout(() => {
        log(
          `after-click +0ms href=${location.href} visibility=${document.visibilityState}`
        )
      }, 0)
      window.setTimeout(() => {
        log(
          `after-click +150ms href=${location.href} visibility=${document.visibilityState}`
        )
      }, 150)
    }

    const onVisibility = () => {
      log(`visibilitychange ${document.visibilityState}`)
    }
    const onPageShow = (event: PageTransitionEvent) => {
      log(`pageshow persisted=${event.persisted} href=${location.href}`)
    }
    const onPageHide = (event: PageTransitionEvent) => {
      log(`pagehide persisted=${event.persisted} href=${location.href}`)
    }
    const onError = (event: ErrorEvent) => {
      log(`error ${event.message}`)
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      log(`unhandledrejection ${String(event.reason)}`)
    }

    document.addEventListener("click", onClick, true)
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pageshow", onPageShow)
    window.addEventListener("pagehide", onPageHide)
    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)

    return () => {
      for (const id of timers) {
        window.clearTimeout(id)
      }
      document.removeEventListener("click", onClick, true)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pageshow", onPageShow)
      window.removeEventListener("pagehide", onPageHide)
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [log, refreshSnapshot])

  const handleCopy = async () => {
    const snapshot = refreshSnapshot()
    const report = formatReport(snapshot, eventsRef.current)
    const ok = await copyText(report)
    setCopyState(ok ? "copied" : "select")
    log(
      ok
        ? "copied report to clipboard"
        : "clipboard failed — select the report below"
    )
    window.setTimeout(() => setCopyState("idle"), 2500)
  }

  const report = formatReport(info, events)

  return (
    <section className="space-y-3">
      <div className="fixed inset-x-0 top-0 z-[100001] border-b bg-background/95 px-4 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs">
            Tap the sheet, then copy this report.
          </p>
          <Button
            data-eiab="debug-copy"
            onClick={handleCopy}
            size="sm"
            type="button"
          >
            {copyButtonLabel(copyState)}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium text-sm">Debug report</h2>
        <Button
          data-eiab="debug-copy"
          onClick={handleCopy}
          size="sm"
          type="button"
          variant="outline"
        >
          {copyButtonLabel(copyState)}
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        Long-press and copy if the button fails inside the in-app browser.
      </p>
      <textarea
        className="h-80 w-full resize-y rounded-md border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed"
        data-eiab="debug-report"
        onFocus={(event) => event.currentTarget.select()}
        readOnly
        spellCheck={false}
        value={report}
      />
    </section>
  )
}
