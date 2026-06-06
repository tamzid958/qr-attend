"use client"

import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import LinearProgress from "@mui/material/LinearProgress"
import Typography from "@mui/material/Typography"

type StatCardColor = "primary" | "secondary" | "success" | "warning" | "error" | "info"

export function StatCard({
  label,
  value,
  sub,
  color,
  progress,
}: {
  label: string
  value: string | number
  sub?: string
  color: StatCardColor
  progress?: number
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography
          sx={{
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "text.secondary",
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: "28px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            mt: 0.75,
            color: "text.primary",
          }}
        >
          {value}
        </Typography>
        {sub && (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mt={0.5}
          >
            {sub}
          </Typography>
        )}
        {progress !== undefined && (
          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, progress))}
            color={color}
            sx={{ mt: 1.5, height: 3, borderRadius: 1 }}
          />
        )}
      </CardContent>
    </Card>
  )
}
