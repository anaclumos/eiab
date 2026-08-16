"use client"

import { type EiabDebugInfo, getDebugInfo } from "eiab"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

interface LogEntry {
  t: number
  line: string
}

const EVENT_STORAGE_KEY = "eiab:debug-events:v1"
const MAX_STORED_EVENTS = 200

function loadStoredEvents(): LogEntry[] {
  try {
    const raw = sessionStorage.getItem(EVENT_STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter(
      (entry): entry is LogEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as LogEntry).t === "number" &&
        typeof (entry as LogEntry).line === "string"
    )
  } catch {
    return []
  }
}

function storeEvents(events: LogEntry[]): void {
  try {
    sessionStorage.setItem(
      EVENT_STORAGE_KEY,
      JSON.stringify(events.slice(-MAX_STORED_EVENTS))
    )
  } catch {
    /* quota / private mode */
  }
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

function deployMeta(): { commit: string; ref: string } {
  return {
    commit: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "",
    ref: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ?? "",
  }
}

function formatReport(info: EiabDebugInfo | null, events: LogEntry[]): string {
  const { commit, ref } = deployMeta()
  const lines = ["=== eiab debug report ===", `copiedAt: ${nowIso()}`]
  if (commit) {
    lines.push(`commit: ${commit}`)
  }
  if (ref) {
    lines.push(`ref: ${ref}`)
  }
  lines.push("")

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
    el.hasAttribute("target") ? `target=${el.getAttribute("target")}` : null,
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
    storeEvents(eventsRef.current)
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
    const restored = loadStoredEvents()
    if (restored.length > 0) {
      eventsRef.current = restored
      setEvents(restored)
    }

    const stillOnPage = (ms: number) => {
      log(
        `still-on-page +${ms}ms href=${location.href} visibility=${document.visibilityState}`
      )
    }
    const timers = [
      window.setTimeout(() => {
        const snapshot = refreshSnapshot()
        log(
          `mount readyState=${document.readyState} href=${location.href} inApp=${snapshot?.isInAppBrowser ?? "?"} gesture=${snapshot?.needsUserGesture ?? "?"} manual=${snapshot?.needsManualEscape ?? "?"} escape=${snapshot?.escapeUrl ?? "null"} restored=${restored.length}`
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
    try {
      await navigator.clipboard.writeText(report)
      setCopyState("copied")
      log("copied report to clipboard")
    } catch {
      setCopyState("select")
      log("clipboard failed — select the report below")
    }
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
