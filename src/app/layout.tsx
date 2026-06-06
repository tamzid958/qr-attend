import type { Metadata } from "next"
import type { ReactNode } from "react"
import { ThemeRegistry } from "@/components/ui/ThemeRegistry"
import { ibmPlexSans } from "@/theme/theme"

export const metadata: Metadata = {
  title: "QR Attendance System",
  description: "QR code event attendance management",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={ibmPlexSans.className}>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  )
}
