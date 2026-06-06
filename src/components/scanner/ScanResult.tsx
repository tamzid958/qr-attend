"use client"

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded"
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded"
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { keyframes } from "@emotion/react"
import type { CheckinResult } from "@/types"

const enter = keyframes`
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
`

const iconPop = keyframes`
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.1); }
  100% { transform: scale(1);   opacity: 1; }
`

const CONFIG = {
  SUCCESS: {
    bg: "#14532d",
    accent: "#22c55e",
    textColor: "#dcfce7",
    label: "CHECKED IN",
    Icon: CheckCircleRoundedIcon,
  },
  DUPLICATE: {
    bg: "#78350f",
    accent: "#f59e0b",
    textColor: "#fef3c7",
    label: "ALREADY SCANNED",
    Icon: WarningAmberRoundedIcon,
  },
  INVALID: {
    bg: "#7f1d1d",
    accent: "#ef4444",
    textColor: "#fee2e2",
    label: "INVALID QR CODE",
    Icon: ErrorRoundedIcon,
  },
} as const

export function ScanResult({ result }: { result: CheckinResult | null }) {
  if (!result) return null

  const { bg, accent, textColor, label, Icon } = CONFIG[result.status]

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 240,
        bgcolor: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.25,
        p: 3,
        animation: `${enter} 0.22s ease-out`,
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          animation: `${iconPop} 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)`,
          lineHeight: 0,
          mb: 0.5,
        }}
      >
        <Icon sx={{ fontSize: 72, color: accent }} />
      </Box>

      {/* Attendee name */}
      {result.attendee?.name && (
        <Typography
          variant="h5"
          fontWeight={800}
          textAlign="center"
          sx={{ color: textColor, letterSpacing: "-0.03em", lineHeight: 1.1 }}
        >
          {result.attendee.name}
        </Typography>
      )}

      {/* Email */}
      {result.attendee?.email && (
        <Typography
          variant="body2"
          textAlign="center"
          sx={{ color: textColor, opacity: 0.65, mt: -0.5 }}
        >
          {result.attendee.email}
        </Typography>
      )}

      {/* Status badge */}
      <Box
        sx={{
          mt: 1,
          px: 1.75,
          py: 0.5,
          borderRadius: "4px",
          border: "1.5px solid",
          borderColor: `${accent}60`,
          bgcolor: `${accent}18`,
        }}
      >
        <Typography
          variant="caption"
          fontWeight={800}
          letterSpacing="0.12em"
          sx={{ color: accent }}
        >
          {label}
        </Typography>
      </Box>

      {/* Extra context */}
      {result.status === "DUPLICATE" && result.firstCheckinAt && (
        <Typography
          variant="caption"
          textAlign="center"
          sx={{ color: textColor, opacity: 0.55, mt: 0.25 }}
        >
          First scan: {result.firstCheckinAt}
        </Typography>
      )}
    </Box>
  )
}
