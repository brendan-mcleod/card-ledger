import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "Card Ledger",
  description: "A baseball card collection home for logging cards, curating collections, and tracking the shelf.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
