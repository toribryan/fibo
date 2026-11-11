import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import type { ReactNode } from "react"

import { Provider } from "@/components/provider"

import "./global.css"

// Self-hosted at build time. The variables override the family names in
// globals.css, which assume Geist is installed or loaded by the page.
const sans = Geist({ subsets: ["latin"], variable: "--font-sans" })
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  metadataBase: new URL("https://fibo.toribryan.com"),
  title: { template: "%s | fibo", default: "fibo" },
  description:
    "An achromatic design system built on shadcn/ui and Base UI, installed from a shadcn registry.",
  openGraph: { siteName: "fibo", type: "website" },
  twitter: { card: "summary_large_image" },
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
