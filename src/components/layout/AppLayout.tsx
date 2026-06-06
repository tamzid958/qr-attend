"use client"

import Box from "@mui/material/Box"
import Breadcrumbs from "@mui/material/Breadcrumbs"
import MuiLink from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import useMediaQuery from "@mui/material/useMediaQuery"
import { useTheme } from "@mui/material/styles"
import NextLink from "next/link"
import { useState, type ReactNode } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import type { SessionUser } from "@/types"

export function AppLayout({
  user,
  breadcrumb,
  children,
}: {
  user: SessionUser
  breadcrumb?: Array<{ label: string; href?: string }>
  children: ReactNode
}) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Sidebar
        role={user.role}
        user={user}
        variant={isMobile ? "temporary" : "permanent"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
        <Topbar onMenuClick={() => setDrawerOpen(true)} />
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
          {breadcrumb && breadcrumb.length > 0 && (
            <Breadcrumbs sx={{ mb: 2, fontSize: 13 }}>
              {breadcrumb.map((crumb, i) =>
                crumb.href ? (
                  <MuiLink key={i} component={NextLink} href={crumb.href} underline="hover" color="inherit" sx={{ fontSize: 13 }}>
                    {crumb.label}
                  </MuiLink>
                ) : (
                  <Typography key={i} sx={{ fontSize: 13 }} color="text.primary">{crumb.label}</Typography>
                ),
              )}
            </Breadcrumbs>
          )}
          {children}
        </Box>
      </Box>
    </Box>
  )
}
