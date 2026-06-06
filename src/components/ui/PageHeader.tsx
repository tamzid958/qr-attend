"use client"

import Box from "@mui/material/Box"
import type { ReactNode } from "react"

export function PageHeader({
  children,
  actions,
}: {
  children?: ReactNode
  actions?: ReactNode
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: { xs: "flex-start", md: "center" },
        justifyContent: "space-between",
        flexDirection: { xs: "column", md: "row" },
        gap: 2,
        mb: 3,
      }}
    >
      <Box>{children}</Box>
      {actions && (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexShrink: 0,
            width: { xs: "100%", md: "auto" },
            "& .MuiButton-root": {
              flexGrow: { xs: 1, md: 0 },
            },
          }}
        >
          {actions}
        </Box>
      )}
    </Box>
  )
}
