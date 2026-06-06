"use client"

import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"
import CssBaseline from "@mui/material/CssBaseline"
import { ThemeProvider } from "@mui/material/styles"
import { lightTheme } from "@/theme/theme"
import { EmotionRegistry } from "@/components/ui/EmotionRegistry"

export function ThemeRegistry({ children }: { children: ReactNode }) {
  return (
    <EmotionRegistry>
      <SessionProvider>
        <ThemeProvider theme={lightTheme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </SessionProvider>
    </EmotionRegistry>
  )
}
