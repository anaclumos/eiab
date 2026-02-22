import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { EscapeInAppBrowser } from "eiab/react"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "eiab - Escape In-App Browser",
  description:
    "Detect and escape from in-app browsers (Instagram, Facebook, Twitter, KakaoTalk, LINE, etc.)",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className={inter.variable} lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Script
          data-token="e2e39295-face-45be-a80e-94ff15026f81"
          src="https://cdn.visitors.now/v.js"
          strategy="afterInteractive"
        />
        <EscapeInAppBrowser />
      </body>
    </html>
  )
}
