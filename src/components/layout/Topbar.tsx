"use client"

import MenuIcon from "@mui/icons-material/Menu"
import AppBar from "@mui/material/AppBar"
import Breadcrumbs from "@mui/material/Breadcrumbs"
import IconButton from "@mui/material/IconButton"
import Toolbar from "@mui/material/Toolbar"
import Typography from "@mui/material/Typography"
import { usePathname } from "next/navigation"

function pageLabel(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "Home"
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function Topbar({
  onMenuClick,
}: {
  onMenuClick: () => void
}) {
  const pathname = usePathname()
  const label = pageLabel(pathname)

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{ borderBottom: "1px solid", borderBottomColor: "divider" }}
    >
      <Toolbar sx={{ gap: 1, minHeight: { xs: 48, sm: 48 } }}>
        {/* Hamburger — mobile only */}
        <IconButton
          onClick={onMenuClick}
          size="small"
          sx={{ display: { xs: "flex", md: "none" }, mr: 0.5 }}
          aria-label="Open navigation"
        >
          <MenuIcon fontSize="small" />
        </IconButton>

        {/* Breadcrumb — desktop only */}
        <Breadcrumbs sx={{ display: { xs: "none", md: "flex" }, flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary">
            QR Attend
          </Typography>
          <Typography variant="body2" fontWeight={700} color="text.primary">
            {label}
          </Typography>
        </Breadcrumbs>

        {/* Page title — mobile only */}
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{ display: { xs: "block", md: "none" }, flexGrow: 1 }}
        >
          {label}
        </Typography>
      </Toolbar>
    </AppBar>
  )
}
