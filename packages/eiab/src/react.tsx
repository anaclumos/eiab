"use client"

import { type ReactNode, useEffect, useState } from "react"
import { attemptEscape, isInAppBrowser } from "./index.js"

export interface EscapeInAppBrowserProps {
  url?: string | undefined
  userAgent?: string | undefined
}

export function EscapeInAppBrowser({
  url,
  userAgent,
}: EscapeInAppBrowserProps): null {
  useEffect(() => {
    attemptEscape(url, userAgent)
  }, [url, userAgent])

  return null
}

export function useIsInAppBrowser(userAgent?: string): boolean | null {
  const [inApp, setInApp] = useState<boolean | null>(null)

  useEffect(() => {
    setInApp(isInAppBrowser(userAgent))
  }, [userAgent])

  return inApp
}

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
