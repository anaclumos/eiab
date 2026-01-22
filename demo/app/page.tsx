"use client"

import { getEscapeUrl, isInAppBrowser } from "eiab"
import { EiabFailed, EiabSuccess, useIsInAppBrowser } from "eiab/react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const SAMPLE_USER_AGENTS = {
  safari_ios: {
    label: "Safari (iOS)",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  },
  chrome_android: {
    label: "Chrome (Android)",
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  },
  facebook_ios: {
    label: "Facebook (iOS)",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22B83 [FBAN/FBIOS;FBAV/488.0.0.68.101;IABMV/1]",
  },
  facebook_android: {
    label: "Facebook (Android)",
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.83 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/488.0.0.62.79;IABMV/1;]",
  },
  gsa_ios: {
    label: "Google Search App (iOS)",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/334.0.674067880 Mobile/15E148 Safari/604.1",
  },
  instagram_ios: {
    label: "Instagram (iOS)",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22B83 Instagram 354.0.0.29.90 (iPhone12,8; iOS 18_1; en_US; en; scale=2.00; 750x1334; 654111336; IABMV/1)",
  },
  instagram_android: {
    label: "Instagram (Android)",
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.58 Mobile Safari/537.36 Instagram 355.1.0.44.103 Android (34/14; 420dpi; 1080x2205; Google/google; Pixel 8; shiba; shiba; en_US; 658190016)",
  },
  line_ios: {
    label: "LINE (iOS)",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/14.0.0",
  },
  line_android: {
    label: "LINE (Android)",
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.83 Mobile Safari/537.36 Line/14.0.0/IAB",
  },
  linkedin_ios: {
    label: "LinkedIn (iOS)",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.30.1753",
  },
  messenger_ios: {
    label: "Messenger (iOS)",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/482.2.0.68.110;FBBV/658316928;FBDV/iPhone12,8;FBMD/iPhone;FBSN/iOS;FBSV/18.1;FBSS/2;FBCR/;FBID/phone;FBLC/en_US;FBOP/80]",
  },
  messenger_android: {
    label: "Messenger (Android)",
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.58 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/482.0.0.71.108;]",
  },
  snapchat_ios: {
    label: "Snapchat (iOS)",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Snapchat/12.72.0.39 (like Safari/8617.2.4.10.8, panda)",
  },
  threads_ios: {
    label: "Threads (iOS)",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/23D5103d Barcelona 413.1.0.23.79 (iPhone18,1; iOS 26_3; en_US; en; scale=3.00; 1206x2622; IABMV/1; 865807478)",
  },
  threads_android: {
    label: "Threads (Android)",
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.58 Mobile Safari/537.36 Barcelona 355.0.0.39.109 Android (34/14; 420dpi; 1080x2205; Google/google; Pixel 8; shiba; shiba; en_US; 657318936)",
  },
  tiktok_ios: {
    label: "TikTok (iOS)",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 BytedanceWebview/d8a21c6 musical_ly_33.2.1 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/en Region/US",
  },
  tiktok_android: {
    label: "TikTok (Android)",
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/121.0.6167.143 Mobile Safari/537.36 musical_ly_2023303040 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/musical_ly app_version/33.3.4 ByteLocale/en ByteFullLocale/en Region/US AppId/1233 Spark/1.5.0.5-alpha.2 AppVersion/33.3.4 BytedanceWebview/d8a21c6",
  },
  twitter_ios: {
    label: "Twitter/X (iOS)",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/23D5103d Twitter for iPhone/11.57",
  },
  wechat_ios: {
    label: "WeChat (iOS)",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50 NetType/WIFI Language/en",
  },
  wechat_android: {
    label: "WeChat (Android)",
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.83 Mobile Safari/537.36 MicroMessenger/8.0.50.2800 NetType/WIFI Language/en",
  },
  whatsapp_ios: {
    label: "WhatsApp (iOS)",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0.1 Mobile/15E148 Safari/604.1 [WAiOS/2.25.31]",
  },
  whatsapp_android: {
    label: "WhatsApp (Android)",
    ua: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.124 Mobile Safari/537.36 [WA4A/2.25.32.75;]",
  },
  kakao_ios: {
    label: "KakaoTalk (iOS)",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.8.5",
  },
  kakao_android: {
    label: "KakaoTalk (Android)",
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 KAKAOTALK 10.8.5",
  },
} as const

type UAKey = keyof typeof SAMPLE_USER_AGENTS

function BrowserStatusBadge({ inApp }: { inApp: boolean | null }) {
  if (inApp === null) {
    return (
      <Badge className="animate-pulse" variant="outline">
        Checking...
      </Badge>
    )
  }
  if (inApp) {
    return <Badge variant="destructive">In-App Browser Detected</Badge>
  }
  return <Badge variant="secondary">Normal Browser</Badge>
}

function TryItYourself() {
  const inApp = useIsInAppBrowser()
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    const shareData = {
      title: "eiab - Escape In-App Browser",
      text: "Check if you're in an in-app browser!",
      url,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      } catch {
        handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  const handleCopy = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* empty */
    }
  }

  return (
    <Card className="border-2 border-dashed">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">Try It Yourself</CardTitle>
        <CardDescription>
          Share this page and open it from Instagram, Facebook, or Twitter to
          see eiab in action
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-3">
          <span className="text-muted-foreground text-sm">Your browser:</span>
          <BrowserStatusBadge inApp={inApp} />
        </div>

        {inApp && (
          <div className="rounded-md bg-amber-500/10 p-3 text-center text-amber-700 text-sm dark:text-amber-400">
            You&apos;re viewing this in an in-app browser! In production, eiab
            would automatically redirect you to Safari or Chrome.
          </div>
        )}

        <div className="flex justify-center gap-2">
          <Button onClick={handleShare} size="lg">
            {shared ? (
              <>
                <svg
                  aria-hidden="true"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                Shared!
              </>
            ) : (
              <>
                <svg
                  aria-hidden="true"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                Share This Page
              </>
            )}
          </Button>
          <Button onClick={handleCopy} size="lg" variant="outline">
            {copied ? (
              <>
                <svg
                  aria-hidden="true"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg
                  aria-hidden="true"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                Copy Link
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-muted-foreground text-xs">
          Open the shared link from Instagram, Facebook, Twitter, or any other
          app to test detection
        </p>

        <div className="grid gap-4 pt-4 md:grid-cols-2">
          <div className="space-y-2">
            <span className="font-medium text-muted-foreground text-xs">
              Code
            </span>
            <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-[10px] leading-relaxed">
              {`<EiabSuccess>
  <p>You're in a normal browser!</p>
</EiabSuccess>
<EiabFailed>
  <p>Please open in Safari or Chrome.</p>
</EiabFailed>`}
            </pre>
          </div>
          <div className="space-y-2">
            <span className="font-medium text-muted-foreground text-xs">
              Live Result
            </span>
            <div className="rounded-md border bg-muted/30 p-3">
              <EiabSuccess
                fallback={
                  <p className="animate-pulse text-muted-foreground text-sm">
                    Loading...
                  </p>
                }
              >
                <p className="text-sm">You&apos;re in a normal browser!</p>
              </EiabSuccess>
              <EiabFailed fallback={null}>
                <p className="text-sm">Please open in Safari or Chrome.</p>
              </EiabFailed>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DetectionDemo() {
  const [selectedUA, setSelectedUA] = useState<UAKey>("safari_ios")
  const currentUA = SAMPLE_USER_AGENTS[selectedUA]
  const isInApp = isInAppBrowser(currentUA.ua)
  const escapeUrl = getEscapeUrl("https://example.com/checkout", currentUA.ua)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Core API Demo</CardTitle>
        <CardDescription>
          Test in-app browser detection with different user agents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <span className="font-medium text-muted-foreground text-xs">
            Simulated User Agent
          </span>
          <Select
            onValueChange={(v) => setSelectedUA(v as UAKey)}
            value={selectedUA}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SAMPLE_USER_AGENTS).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="break-all rounded-md bg-muted/50 p-3 font-mono text-[10px] leading-relaxed">
          {currentUA.ua}
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">
              isInAppBrowser()
            </span>
            <Badge variant={isInApp ? "destructive" : "secondary"}>
              {isInApp ? "In-App Browser" : "Normal Browser"}
            </Badge>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">
              getEscapeUrl()
            </span>
            {escapeUrl ? (
              <div className="break-all rounded-md bg-muted/50 p-2 font-mono text-[10px] text-green-600 dark:text-green-400">
                {escapeUrl}
              </div>
            ) : (
              <div className="rounded-md bg-muted/50 p-2 font-mono text-[10px] text-muted-foreground">
                null (no escape needed)
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ReactComponentDemo() {
  const [simulatedUA, setSimulatedUA] = useState<string | undefined>(undefined)
  const inApp = useIsInAppBrowser(simulatedUA)

  return (
    <Card>
      <CardHeader>
        <CardTitle>React Components</CardTitle>
        <CardDescription>
          Conditional rendering with EiabSuccess and EiabFailed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={() => setSimulatedUA(undefined)}
            size="sm"
            variant={simulatedUA === undefined ? "default" : "outline"}
          >
            Real Browser
          </Button>
          <Button
            onClick={() => setSimulatedUA(SAMPLE_USER_AGENTS.instagram_ios.ua)}
            size="sm"
            variant={
              simulatedUA === SAMPLE_USER_AGENTS.instagram_ios.ua
                ? "default"
                : "outline"
            }
          >
            Simulate Instagram
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              useIsInAppBrowser():
            </span>
            <Badge variant="outline">
              {inApp === null ? "null (SSR)" : String(inApp)}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 rounded-md border p-4">
          <EiabSuccess
            fallback={
              <div className="animate-pulse text-muted-foreground text-xs">
                Loading...
              </div>
            }
            userAgent={simulatedUA}
          >
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <svg
                aria-hidden="true"
                className="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              <span className="font-medium text-sm">
                You&apos;re using a real browser!
              </span>
            </div>
          </EiabSuccess>

          <EiabFailed fallback={null} userAgent={simulatedUA}>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <svg
                aria-hidden="true"
                className="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              <span className="font-medium text-sm">
                In-app browser detected! Open in Safari or Chrome for the best
                experience.
              </span>
            </div>
          </EiabFailed>
        </div>

        <div className="space-y-2 rounded-md bg-muted/30 p-3">
          <p className="font-medium text-xs">Code Example:</p>
          <pre className="overflow-x-auto font-mono text-[10px]">
            {`<EiabSuccess>
  <p>You're in a normal browser!</p>
</EiabSuccess>
<EiabFailed>
  <p>Please open in Safari or Chrome.</p>
</EiabFailed>`}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

function EscapeStrategiesDemo() {
  const strategies = [
    {
      platform: "iOS (Generic)",
      method: "x-safari-https://...",
      description: "Opens directly in Safari",
    },
    {
      platform: "Android (Generic)",
      method: "intent://...#Intent;package=com.android.chrome;end",
      description: "Chrome Intent URI for reliable escape",
    },
    {
      platform: "KakaoTalk",
      method: "kakaotalk://web/openExternal?url=...",
      description: "Uses KakaoTalk's native external browser scheme",
    },
    {
      platform: "LINE (iOS/Android)",
      method: "?openExternalBrowser=1",
      description: "LINE respects this query parameter on both platforms",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escape Strategies</CardTitle>
        <CardDescription>
          Platform-specific methods to escape in-app browsers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {strategies.map((s) => (
            <div className="space-y-1" key={s.platform}>
              <div className="flex items-center gap-2">
                <Badge className="text-[10px]" variant="outline">
                  {s.platform}
                </Badge>
              </div>
              <code className="block break-all font-mono text-[10px] text-muted-foreground">
                {s.method}
              </code>
              <p className="text-[10px] text-muted-foreground/70">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function QuickStartDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Start</CardTitle>
        <CardDescription>Add eiab to your app in seconds</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Badge variant="secondary">Install</Badge>
          <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-[11px]">
            bun add eiab
          </pre>
        </div>

        <div className="space-y-2">
          <Badge variant="secondary">Vanilla JS</Badge>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 font-mono text-[11px]">
            {`import { attemptEscape } from "eiab"

// Auto-escapes if in-app browser detected
attemptEscape()`}
          </pre>
        </div>

        <div className="space-y-2">
          <Badge variant="secondary">React / Next.js</Badge>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 font-mono text-[11px]">
            {`import { EscapeInAppBrowser } from "eiab/react"

export default function Layout({ children }) {
  return (
    <>
      <EscapeInAppBrowser />
      {children}
    </>
  )
}`}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
        <header className="space-y-2 text-center">
          <h1 className="font-bold text-2xl tracking-tight">eiab</h1>
          <p className="mx-auto max-w-md text-muted-foreground text-sm">
            Escape In-App Browser — Detect and escape from in-app browsers
            (Facebook, Instagram, Threads, Messenger, Twitter/X, TikTok,
            WhatsApp, WeChat, LINE, Snapchat, LinkedIn, Google Search App,
            KakaoTalk)
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Badge>Zero Dependencies</Badge>
            <Badge variant="outline">ESM Only</Badge>
            <Badge variant="secondary">{"< 1KB"}</Badge>
          </div>
        </header>

        <TryItYourself />

        <div className="grid gap-6 md:grid-cols-2">
          <DetectionDemo />
          <ReactComponentDemo />
          <EscapeStrategiesDemo />
          <QuickStartDemo />
        </div>

        <footer className="border-t pt-4 text-center">
          <a
            className="text-muted-foreground text-xs transition-colors hover:text-foreground"
            href="https://github.com/anaclumos/eiab"
          >
            github.com/anaclumos/eiab
          </a>
        </footer>
      </div>
    </div>
  )
}
