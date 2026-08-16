"use client"

import { useIsInAppBrowser } from "eiab/react"
import { Badge } from "@/components/ui/badge"
import { DebugPanel } from "./debug-panel"

function StatusBadge() {
  const inApp = useIsInAppBrowser()

  if (inApp === null) {
    return <Badge variant="secondary">Checking…</Badge>
  }

  if (inApp) {
    return <Badge variant="destructive">In-app browser</Badge>
  }

  return <Badge variant="outline">Normal browser</Badge>
}

export default function Home() {
  return (
    <main className="mx-auto max-w-lg px-4 pt-16 pb-12">
      <header className="mb-8 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-semibold text-xl tracking-tight">eiab</h1>
          <StatusBadge />
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          If a sheet appears, tap <strong>Open in browser</strong> (even if
          nothing happens), then <strong>Continue anyway</strong>, then copy the
          report below.
        </p>
      </header>
      <DebugPanel />
    </main>
  )
}
