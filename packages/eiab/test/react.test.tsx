import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import {
  EiabFailed,
  EiabSuccess,
  EscapeInAppBrowser,
  useIsInAppBrowser,
} from "../src/react"

const INSTAGRAM_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram"
const SAFARI_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"

function TestHookComponent({ userAgent }: { userAgent?: string }) {
  const inApp = useIsInAppBrowser(userAgent)
  return <div data-testid="result">{String(inApp)}</div>
}

describe("React Components", () => {
  let originalNavigator: typeof globalThis.navigator
  let originalLocation: typeof globalThis.location
  let originalWindow: typeof globalThis.window

  beforeEach(() => {
    originalNavigator = globalThis.navigator
    originalLocation = globalThis.location
    originalWindow = globalThis.window
  })

  afterEach(() => {
    globalThis.navigator = originalNavigator
    globalThis.location = originalLocation
    ;(globalThis as any).window = originalWindow
    cleanup()
  })

  describe("useIsInAppBrowser", () => {
    it("returns true for in-app browser UA", async () => {
      const { getByTestId } = render(
        <TestHookComponent userAgent={INSTAGRAM_IOS_UA} />
      )

      await waitFor(() => {
        expect(getByTestId("result").textContent).toBe("true")
      })
    })

    it("returns false for normal browser UA", async () => {
      const { getByTestId } = render(
        <TestHookComponent userAgent={SAFARI_UA} />
      )

      await waitFor(() => {
        expect(getByTestId("result").textContent).toBe("false")
      })
    })

    it("uses navigator.userAgent when not provided", async () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: INSTAGRAM_IOS_UA },
        writable: true,
        configurable: true,
      })

      const { getByTestId } = render(<TestHookComponent />)

      await waitFor(() => {
        expect(getByTestId("result").textContent).toBe("true")
      })
    })
  })

  describe("EiabSuccess", () => {
    it("renders children when NOT in an in-app browser", async () => {
      render(
        <EiabSuccess userAgent={SAFARI_UA}>
          <span data-testid="success">Success content</span>
        </EiabSuccess>
      )

      await waitFor(() => {
        expect(screen.getByTestId("success")).toBeTruthy()
      })
    })

    it("renders nothing when IN an in-app browser", async () => {
      render(
        <EiabSuccess userAgent={INSTAGRAM_IOS_UA}>
          <span data-testid="success">Success content</span>
        </EiabSuccess>
      )

      await waitFor(() => {
        expect(screen.queryByTestId("success")).toBeNull()
      })
    })

    it("accepts fallback prop", async () => {
      render(
        <EiabSuccess
          fallback={<span data-testid="fallback">Loading</span>}
          userAgent={SAFARI_UA}
        >
          <span data-testid="content">Content</span>
        </EiabSuccess>
      )

      await waitFor(() => {
        expect(screen.getByTestId("content")).toBeTruthy()
      })
    })
  })

  describe("EiabFailed", () => {
    it("renders children when IN an in-app browser", async () => {
      render(
        <EiabFailed userAgent={INSTAGRAM_IOS_UA}>
          <span data-testid="failed">Failed content</span>
        </EiabFailed>
      )

      await waitFor(() => {
        expect(screen.getByTestId("failed")).toBeTruthy()
      })
    })

    it("renders nothing when NOT in an in-app browser", async () => {
      render(
        <EiabFailed userAgent={SAFARI_UA}>
          <span data-testid="failed">Failed content</span>
        </EiabFailed>
      )

      await waitFor(() => {
        expect(screen.queryByTestId("failed")).toBeNull()
      })
    })

    it("accepts fallback prop", async () => {
      render(
        <EiabFailed
          fallback={<span data-testid="fallback">Loading</span>}
          userAgent={INSTAGRAM_IOS_UA}
        >
          <span data-testid="content">Content</span>
        </EiabFailed>
      )

      await waitFor(() => {
        expect(screen.getByTestId("content")).toBeTruthy()
      })
    })
  })

  describe("EscapeInAppBrowser", () => {
    it("renders null", () => {
      const { container } = render(
        <EscapeInAppBrowser url="https://example.com" userAgent={SAFARI_UA} />
      )
      expect(container.innerHTML).toBe("")
    })

    it("does not escape for non-in-app browsers", async () => {
      const originalHref = "https://example.com/page"
      const mockLocation = { href: originalHref }

      ;(globalThis as any).window = { location: mockLocation }

      render(<EscapeInAppBrowser url={originalHref} userAgent={SAFARI_UA} />)

      await new Promise((r) => setTimeout(r, 50))
      expect(mockLocation.href).toBe(originalHref)
    })
  })
})
