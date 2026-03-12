"use client"

import { type ReactNode, useEffect, useState } from "react"
import { attemptEscape, getEscapeUrl, isInAppBrowser } from "./index.js"

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useIsInAppBrowser(userAgent?: string): boolean | null {
  const [inApp, setInApp] = useState<boolean | null>(null)

  useEffect(() => {
    setInApp(isInAppBrowser(userAgent))
  }, [userAgent])

  return inApp
}

export function useEscapeUrl(url?: string, userAgent?: string): string | null {
  const [escapeUrl, setEscapeUrl] = useState<string | null>(null)

  useEffect(() => {
    setEscapeUrl(getEscapeUrl(url, userAgent))
  }, [url, userAgent])

  return escapeUrl
}

// ---------------------------------------------------------------------------
// Shared helper: escape via user-gesture click
// ---------------------------------------------------------------------------

function escapeViaClick(escapeUrl: string): void {
  try {
    if (typeof window !== "undefined" && window.open) {
      const opened = window.open(escapeUrl, "_blank")
      if (opened) {
        return
      }
    }
  } catch (_) {
    /* empty */
  }

  try {
    if (typeof window !== "undefined" && window.location) {
      window.location.href = escapeUrl
    }
  } catch (_) {
    /* empty */
  }
}

// ---------------------------------------------------------------------------
// EscapeInAppBrowser - auto-escape with optional fallback UI
// ---------------------------------------------------------------------------

export interface EscapeInAppBrowserProps {
  url?: string | undefined
  userAgent?: string | undefined
  fallback?: ReactNode
}

export function EscapeInAppBrowser({
  url,
  userAgent,
  fallback = null,
}: EscapeInAppBrowserProps): ReactNode {
  const inApp = useIsInAppBrowser(userAgent)

  useEffect(() => {
    attemptEscape(url, userAgent)
  }, [url, userAgent])

  // If automatic escape worked, the page navigated away and this never shows.
  // If it failed (e.g. Meta iOS apps), render the fallback so the user can tap.
  if (inApp && fallback) {
    return fallback
  }

  return null
}

// ---------------------------------------------------------------------------
// Conditional rendering
// ---------------------------------------------------------------------------

export interface EiabConditionalProps {
  children: ReactNode
  userAgent?: string | undefined
  fallback?: ReactNode
}

export function EiabSuccess({
  children,
  userAgent,
  fallback = null,
}: EiabConditionalProps): ReactNode {
  const inApp = useIsInAppBrowser(userAgent)

  if (inApp === null) {
    return fallback
  }
  if (inApp) {
    return null
  }

  return children
}

export function EiabFailed({
  children,
  userAgent,
  fallback = null,
}: EiabConditionalProps): ReactNode {
  const inApp = useIsInAppBrowser(userAgent)

  if (inApp === null) {
    return fallback
  }
  if (!inApp) {
    return null
  }

  return children
}

// ---------------------------------------------------------------------------
// EiabEscapeLink - clickable escape element (works in Meta iOS in-app browsers)
// ---------------------------------------------------------------------------

export interface EiabEscapeLinkProps {
  children: ReactNode
  url?: string | undefined
  userAgent?: string | undefined
  className?: string | undefined
  style?: React.CSSProperties | undefined
}

export function EiabEscapeLink({
  children,
  url,
  userAgent,
  className,
  style,
}: EiabEscapeLinkProps): ReactNode {
  const escapeUrl = useEscapeUrl(url, userAgent)

  if (!escapeUrl) {
    return null
  }

  return (
    <a
      className={className}
      data-eiab="escape-link"
      href={escapeUrl}
      onClick={(e) => {
        e.preventDefault()
        escapeViaClick(escapeUrl)
      }}
      style={style}
    >
      {children}
    </a>
  )
}

// ---------------------------------------------------------------------------
// EiabEscapeDialog - bottom-sheet style dialog with escape button
// ---------------------------------------------------------------------------

export interface EiabEscapeDialogProps {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  dismiss?: ReactNode
  url?: string | undefined
  userAgent?: string | undefined
  className?: string | undefined
  style?: React.CSSProperties | undefined
  onDismiss?: () => void
}

export function EiabEscapeDialog({
  title = "Open in browser",
  description = "For the best experience, open this page in your default browser.",
  action = "Open in browser",
  dismiss = "Continue anyway",
  url,
  userAgent,
  className,
  style,
  onDismiss,
}: EiabEscapeDialogProps): ReactNode {
  const inApp = useIsInAppBrowser(userAgent)
  const escapeUrl = useEscapeUrl(url, userAgent)
  const [dismissed, setDismissed] = useState(false)

  if (!inApp || dismissed || !escapeUrl) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div
      className={className}
      data-eiab="dialog-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99_999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        ...style,
      }}
    >
      <div
        data-eiab="dialog"
        style={{
          width: "100%",
          maxWidth: "24rem",
          borderRadius: "1rem",
          backgroundColor: "#fff",
          padding: "1.5rem",
          textAlign: "center",
          boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.15)",
        }}
      >
        {title && (
          <div
            data-eiab="dialog-title"
            style={{
              margin: "0 0 0.5rem",
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "#111",
            }}
          >
            {title}
          </div>
        )}
        {description && (
          <div
            data-eiab="dialog-description"
            style={{
              margin: "0 0 1.25rem",
              fontSize: "0.875rem",
              color: "#666",
              lineHeight: 1.5,
            }}
          >
            {description}
          </div>
        )}
        <a
          data-eiab="dialog-action"
          href={escapeUrl}
          onClick={(e) => {
            e.preventDefault()
            escapeViaClick(escapeUrl)
          }}
          style={{
            display: "block",
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            backgroundColor: "#111",
            color: "#fff",
            fontSize: "0.9375rem",
            fontWeight: 500,
            textAlign: "center",
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          {action}
        </a>
        <button
          data-eiab="dialog-dismiss"
          onClick={handleDismiss}
          style={{
            display: "block",
            width: "100%",
            marginTop: "0.75rem",
            padding: "0.5rem",
            background: "none",
            border: "none",
            color: "#999",
            fontSize: "0.8125rem",
            cursor: "pointer",
          }}
          type="button"
        >
          {dismiss}
        </button>
      </div>
    </div>
  )
}
