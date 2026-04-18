"use client"

import { type ReactNode, useEffect, useState } from "react"
import { attemptEscape, getEscapeUrl, isInAppBrowser } from "./index.js"

// ---------------------------------------------------------------------------
// Shared anchor styles / behavior
// ---------------------------------------------------------------------------
//
// Meta iOS WKWebViews (Instagram, Facebook, Messenger, Threads) drop
// programmatic window.open(x-safari-...) and location.href redirects even
// inside React click handlers. Native anchor navigation carries the strongest
// signal of user activation, so these components render plain <a href> and
// let the browser handle the scheme redirect. No preventDefault, no
// window.open -- both weaken the click's ability to escape the WebView.

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
// EiabEscapeLink - user-tappable escape link (native <a href> navigation)
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
  copy?: ReactNode
  copied?: ReactNode
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
  copy = "Copy link",
  copied = "Copied!",
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
  const [didCopy, setDidCopy] = useState(false)

  if (!inApp || dismissed || !escapeUrl) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  const handleCopy = async () => {
    const target =
      url ?? (typeof window !== "undefined" ? window.location?.href : undefined)
    if (!target) {
      return
    }
    try {
      await navigator.clipboard.writeText(target)
      setDidCopy(true)
      setTimeout(() => setDidCopy(false), 2000)
    } catch (_) {
      /* clipboard unavailable */
    }
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
          data-eiab="dialog-copy"
          onClick={handleCopy}
          style={{
            display: "block",
            width: "100%",
            marginTop: "0.5rem",
            padding: "0.625rem 1rem",
            borderRadius: "0.75rem",
            background: "none",
            border: "1px solid #ddd",
            color: "#333",
            fontSize: "0.875rem",
            fontWeight: 500,
            textAlign: "center",
            cursor: "pointer",
          }}
          type="button"
        >
          {didCopy ? copied : copy}
        </button>
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
