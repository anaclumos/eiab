"use client";

import { useEffect } from "react";
import { attemptEscape } from "./index.js";

export interface EscapeInAppBrowserProps {
  /**
   * Override the URL to escape to. Defaults to current page URL.
   */
  url?: string;
  /**
   * Override user agent detection. Defaults to navigator.userAgent.
   */
  userAgent?: string;
}

/**
 * Drop-in React component that automatically escapes in-app browsers on mount.
 * Renders nothing to the DOM.
 *
 * @example
 * ```tsx
 * import { EscapeInAppBrowser } from "eiab/react";
 *
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       <EscapeInAppBrowser />
 *       {children}
 *     </>
 *   );
 * }
 * ```
 */
export function EscapeInAppBrowser({ url, userAgent }: EscapeInAppBrowserProps): null {
  useEffect(() => {
    attemptEscape(url, userAgent);
  }, [url, userAgent]);

  return null;
}
