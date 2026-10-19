"use client"

import { type ReactNode, useEffect, useState } from "react"
import {
  attemptEscape,
  getEscapeUrl,
  isInAppBrowser,
  needsManualEscape as needsManualEscapeFromCore,
  needsUserGesture as needsUserGestureFromCore,
} from "./index.js"

export function needsUserGesture(userAgent?: string): boolean {
  return needsUserGestureFromCore(userAgent)
}

export function needsManualEscape(userAgent?: string): boolean {
  return needsManualEscapeFromCore(userAgent)
}

const DEFAULT_DESCRIPTION =
  "For the best experience, open this page in your default browser."
const MANUAL_ESCAPE_DESCRIPTION =
  "X does not let websites open Safari. Tap •••, then Open in browser."
const TOAST_MESSAGE = "This page works best in your default browser."
const TOAST_DISMISSED_KEY = "eiab:toast-dismissed"

async function copyPageUrl(url?: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url ?? location.href)
    return true
  } catch {
    return false
  }
}

function useCopyPageUrl(url?: string): {
  didCopy: boolean
  handleCopy: () => Promise<void>
} {
  const [copyCount, setCopyCount] = useState(0)

  useEffect(() => {
    if (copyCount === 0) {
      return
    }
    const timer = setTimeout(
      () => setCopyCount((count) => (count === copyCount ? 0 : count)),
      2000
    )
    return () => clearTimeout(timer)
  }, [copyCount])

  const handleCopy = async () => {
    if (await copyPageUrl(url)) {
      setCopyCount((count) => count + 1)
    }
  }

  return { didCopy: copyCount > 0, handleCopy }
}

// sessionStorage throws in some sandboxed WebViews and private modes; treat
// that as "not dismissed" so the prompt still shows.
function readToastDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(TOAST_DISMISSED_KEY) === "1"
  } catch {
    return false
  }
}

function writeToastDismissed(): void {
  try {
    window.sessionStorage.setItem(TOAST_DISMISSED_KEY, "1")
  } catch {
    // Without storage the dismissal lasts until the next page load.
  }
}

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
// EscapeInAppBrowser - ask before escaping (default) or auto-escape
// ---------------------------------------------------------------------------

// "ask": never navigate on its own; show the fallback, or EiabEscapeToast when
// no fallback is given, and let the user tap to leave.
// "auto": attempt the escape on mount (skipped where needsUserGesture() is
// true) and show the fallback when the page is still here.
export type EscapeMode = "ask" | "auto"

export interface EscapeInAppBrowserProps {
  url?: string | undefined
  userAgent?: string | undefined
  fallback?: ReactNode
  mode?: EscapeMode | undefined
}

export function EscapeInAppBrowser({
  url,
  userAgent,
  fallback,
  mode = "ask",
}: EscapeInAppBrowserProps): ReactNode {
  const inApp = useIsInAppBrowser(userAgent)

  useEffect(() => {
    if (mode === "auto") {
      attemptEscape(url, userAgent)
    }
  }, [mode, url, userAgent])

  if (!inApp) {
    return null
  }
  if (fallback !== undefined) {
    return fallback
  }
  if (mode === "ask") {
    return <EiabEscapeToast url={url} userAgent={userAgent} />
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

  const manual = needsManualEscapeFromCore(userAgent)

  return (
    <a
      className={className}
      data-eiab="escape-link"
      href={escapeUrl}
      onClick={(event) => {
        if (!manual) {
          return
        }
        // https navigation reloads inside X. Keep href for long-press copy.
        event.preventDefault()
        copyPageUrl(url)
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

const dialogActionStyle = {
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
  border: "none",
} as const

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
  description,
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
  const escapeUrl = useEscapeUrl(url, userAgent)
  const [dismissed, setDismissed] = useState(false)
  const { didCopy, handleCopy } = useCopyPageUrl(url)

  if (dismissed || !escapeUrl) {
    return null
  }

  const manual = needsManualEscapeFromCore(userAgent)
  let resolvedDescription = description
  if (description === undefined) {
    resolvedDescription = manual
      ? MANUAL_ESCAPE_DESCRIPTION
      : DEFAULT_DESCRIPTION
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
        {resolvedDescription && (
          <div
            data-eiab="dialog-description"
            style={{
              margin: "0 0 1.25rem",
              fontSize: "0.875rem",
              color: "#666",
              lineHeight: 1.5,
            }}
          >
            {resolvedDescription}
          </div>
        )}
        {manual ? (
          <button
            data-eiab="dialog-action"
            onClick={handleCopy}
            style={dialogActionStyle}
            type="button"
          >
            {didCopy ? copied : copy}
          </button>
        ) : (
          <>
            <a
              data-eiab="dialog-action"
              href={escapeUrl}
              style={dialogActionStyle}
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
          </>
        )}
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

// ---------------------------------------------------------------------------
// EiabEscapeToast - small non-blocking prompt with a tap-to-escape action
// ---------------------------------------------------------------------------

const toastActionStyle = {
  flexShrink: 0,
  padding: "0.5rem 0.75rem",
  borderRadius: "0.5rem",
  backgroundColor: "#fff",
  color: "#111",
  fontSize: "0.875rem",
  fontWeight: 500,
  lineHeight: 1.2,
  textDecoration: "none",
  whiteSpace: "nowrap",
  cursor: "pointer",
  border: "none",
} as const

export interface EiabEscapeToastProps {
  message?: ReactNode
  action?: ReactNode
  copy?: ReactNode
  copied?: ReactNode
  dismissLabel?: string
  url?: string | undefined
  userAgent?: string | undefined
  className?: string | undefined
  style?: React.CSSProperties | undefined
  onDismiss?: () => void
}

export function EiabEscapeToast({
  message,
  action = "Open",
  copy = "Copy link",
  copied = "Copied!",
  dismissLabel = "Dismiss",
  url,
  userAgent,
  className,
  style,
  onDismiss,
}: EiabEscapeToastProps): ReactNode {
  const escapeUrl = useEscapeUrl(url, userAgent)
  const [dismissed, setDismissed] = useState(true)
  const { didCopy, handleCopy } = useCopyPageUrl(url)

  useEffect(() => {
    setDismissed(readToastDismissed())
  }, [])

  if (dismissed || !escapeUrl) {
    return null
  }

  const manual = needsManualEscapeFromCore(userAgent)
  let resolvedMessage = message
  if (message === undefined) {
    resolvedMessage = manual ? MANUAL_ESCAPE_DESCRIPTION : TOAST_MESSAGE
  }

  const handleDismiss = () => {
    writeToastDismissed()
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <output
      className={className}
      data-eiab="toast"
      style={{
        position: "fixed",
        right: "1rem",
        bottom: "max(1rem, env(safe-area-inset-bottom))",
        left: "1rem",
        zIndex: 99_999,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        maxWidth: "24rem",
        margin: "0 auto",
        padding: "0.625rem 0.5rem 0.625rem 1rem",
        borderRadius: "0.75rem",
        backgroundColor: "#111",
        color: "#fff",
        fontSize: "0.875rem",
        lineHeight: 1.4,
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
        ...style,
      }}
    >
      <span data-eiab="toast-message" style={{ flex: 1, minWidth: 0 }}>
        {resolvedMessage}
      </span>
      {manual ? (
        <button
          data-eiab="toast-action"
          onClick={handleCopy}
          style={toastActionStyle}
          type="button"
        >
          {didCopy ? copied : copy}
        </button>
      ) : (
        <a data-eiab="toast-action" href={escapeUrl} style={toastActionStyle}>
          {action}
        </a>
      )}
      <button
        aria-label={dismissLabel}
        data-eiab="toast-dismiss"
        onClick={handleDismiss}
        style={{
          flexShrink: 0,
          width: "2rem",
          height: "2rem",
          padding: 0,
          background: "none",
          border: "none",
          color: "#999",
          fontSize: "1.25rem",
          lineHeight: 1,
          cursor: "pointer",
        }}
        type="button"
      >
        ×
      </button>
    </output>
  )
}
