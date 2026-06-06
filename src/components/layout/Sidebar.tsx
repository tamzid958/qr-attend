"use client"

import DashboardIcon from "@mui/icons-material/Dashboard"
import EventRoundedIcon from "@mui/icons-material/EventRounded"
import LogoutIcon from "@mui/icons-material/Logout"
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded"
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner"
import Avatar from "@mui/material/Avatar"
import Box from "@mui/material/Box"
import Divider from "@mui/material/Divider"
import Drawer from "@mui/material/Drawer"
import IconButton from "@mui/material/IconButton"
import List from "@mui/material/List"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemIcon from "@mui/material/ListItemIcon"
import ListItemText from "@mui/material/ListItemText"
import Typography from "@mui/material/Typography"
import { alpha, useTheme } from "@mui/material/styles"
import { signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { Role } from "@/types"
import type { SessionUser } from "@/types"

const DRAWER_WIDTH = 220

const navigationByRole: Record<Role, Array<{ label: string; href: string; icon: ReactNode }>> = {
  [Role.ADMIN]: [
    { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon fontSize="small" /> },
    { label: "Events", href: "/events", icon: <EventRoundedIcon fontSize="small" /> },
    { label: "Users", href: "/users", icon: <PeopleAltRoundedIcon fontSize="small" /> },
    { label: "Scanner", href: "/scanner", icon: <QrCodeScannerIcon fontSize="small" /> },
  ],
  [Role.SCANNER]: [
    { label: "Scanner", href: "/scanner", icon: <QrCodeScannerIcon fontSize="small" /> },
  ],
}

export function Sidebar({
  role,
  user,
  variant,
  open,
  onClose,
}: {
  role: Role
  user: SessionUser
  variant: "permanent" | "temporary"
  open: boolean
  onClose: () => void
}) {
  const theme = useTheme()
  const pathname = usePathname()
  const router = useRouter()

  const navigate = (href: string) => {
    router.push(href)
    if (variant === "temporary") onClose()
  }

  const content = (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#111",
        color: "#fff",
      }}
    >
      {/* Brand */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#fff",
          }}
        >
          QR Attend
        </Typography>
        <Typography
          sx={{
            fontSize: "9px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.3)",
            mt: 0.25,
          }}
        >
          Event Operations
        </Typography>
      </Box>

      {/* Nav */}
      <Box sx={{ flexGrow: 1, pt: 1 }}>
        <List disablePadding>
          {navigationByRole[role].map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <ListItemButton
                key={item.href}
                onClick={() => navigate(item.href)}
                sx={{
                  px: 2.5,
                  py: 1.1,
                  borderRadius: 0,
                  borderLeft: "2px solid",
                  borderLeftColor: active
                    ? theme.palette.primary.main
                    : "transparent",
                  bgcolor: active
                    ? alpha(theme.palette.primary.main, 0.1)
                    : "transparent",
                  "&:hover": {
                    bgcolor: active
                      ? alpha(theme.palette.primary.main, 0.14)
                      : "rgba(255,255,255,0.05)",
                  },
                  color: active ? "#fff" : "rgba(255,255,255,0.45)",
                  gap: 1.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: "13px",
                        fontWeight: active ? 600 : 500,
                        letterSpacing: "0.01em",
                      },
                    },
                  }}
                />
              </ListItemButton>
            )
          })}
        </List>
      </Box>

      {/* User area */}
      <Divider sx={{ borderColor: "rgba(255,255,255,0.07)" }} />
      <Box sx={{ px: 2, py: 1.75, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar
          sx={{
            width: 30,
            height: 30,
            fontSize: "12px",
            fontWeight: 700,
            bgcolor: "rgba(255,255,255,0.15)",
            color: "#fff",
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.name}
          </Typography>
          <Typography
            sx={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.3)",
              lineHeight: 1.3,
            }}
          >
            {user.role === Role.ADMIN ? "Administrator" : "Scanner"}
          </Typography>
        </Box>
        <IconButton
          onClick={() => signOut({ callbackUrl: "/login" })}
          size="small"
          sx={{ color: "rgba(255,255,255,0.3)", "&:hover": { color: "rgba(255,255,255,0.7)" } }}
          aria-label="Logout"
        >
          <LogoutIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    </Box>
  )

  return (
    <Drawer
      variant={variant}
      open={variant === "permanent" ? true : open}
      onClose={onClose}
      sx={{
        width: variant === "permanent" ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          border: "none",
        },
      }}
    >
      {content}
    </Drawer>
  )
}
