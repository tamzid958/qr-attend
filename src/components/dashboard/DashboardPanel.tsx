"use client"

import BarChartIcon from "@mui/icons-material/BarChart"
import FactCheckIcon from "@mui/icons-material/FactCheck"
import GroupIcon from "@mui/icons-material/Group"
import PersonOffIcon from "@mui/icons-material/PersonOff"
import Box from "@mui/material/Box"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Chip from "@mui/material/Chip"
import Grid from "@mui/material/Grid"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { DataGrid } from "@mui/x-data-grid"
import { useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { PageHeader } from "@/components/ui/PageHeader"
import { StatCard } from "@/components/ui/StatCard"
import type { ApiResponse, DashboardStats, PerEventStat } from "@/types"

export function DashboardPanel({ initialData }: { initialData: DashboardStats }) {
  const [stats, setStats] = useState(initialData)

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const response = await fetch("/api/dashboard")
      const json = (await response.json()) as ApiResponse<DashboardStats>
      if (json.data) setStats(json.data)
    }, 30_000)
    return () => window.clearInterval(interval)
  }, [])

  const presentPct =
    stats.totalRegistered > 0
      ? (stats.totalPresent / stats.totalRegistered) * 100
      : 0
  const absentPct =
    stats.totalRegistered > 0
      ? (stats.totalAbsent / stats.totalRegistered) * 100
      : 0

  return (
    <Stack spacing={3}>
      <PageHeader
        actions={
          <Chip
            label="Live · updates every 30s"
            size="small"
            color="success"
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: "11px" }}
          />
        }
      />

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            color="primary"
            label="Registered"
            value={stats.totalRegistered}
            sub="total attendees"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            color="success"
            label="Present"
            value={stats.totalPresent}
            sub="checked in"
            progress={presentPct}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            color="warning"
            label="Absent"
            value={stats.totalAbsent}
            sub="not seen yet"
            progress={absentPct}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            color="secondary"
            label="Attendance Rate"
            value={`${stats.attendancePercentage}%`}
            sub="of registered"
            progress={stats.attendancePercentage}
          />
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: 320 }}>
            <CardContent sx={{ height: "100%" }}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                mb={2}
                letterSpacing="-0.01em"
              >
                Attendance Summary
              </Typography>
              <ResponsiveContainer width="100%" height="88%">
                <BarChart
                  data={[
                    {
                      name: "Attendance",
                      Present: stats.totalPresent,
                      Absent: stats.totalAbsent,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Absent" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: 320 }}>
            <CardContent sx={{ height: "100%" }}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                mb={2}
                letterSpacing="-0.01em"
              >
                Hourly Check-ins
              </Typography>
              <ResponsiveContainer width="100%" height="88%">
                <LineChart data={stats.hourlyCheckins}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    dataKey="count"
                    stroke="#2563EB"
                    strokeWidth={2}
                    type="monotone"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {stats.perEvent && stats.perEvent.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
            Per-Event Breakdown
          </Typography>
          <DataGrid
            autoHeight
            columns={[
              { field: "title", headerName: "Event", flex: 1.5 },
              { field: "registered", headerName: "Registered", flex: 0.8, type: "number" },
              { field: "present", headerName: "Present", flex: 0.8, type: "number" },
              {
                field: "percentage",
                headerName: "Attendance Rate",
                flex: 1,
                valueGetter: (_v: unknown, row: PerEventStat) =>
                  row.registered > 0 ? `${row.percentage}%` : "—",
              },
            ]}
            density="compact"
            disableColumnMenu
            getRowId={(row: PerEventStat) => row.id}
            hideFooter
            rows={stats.perEvent}
            sx={{
              "& .MuiDataGrid-columnHeaderTitle": {
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              },
            }}
          />
        </Box>
      )}
    </Stack>
  )
}
