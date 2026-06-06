"use client"

import DoorFrontOutlinedIcon from "@mui/icons-material/DoorFrontOutlined"
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded"
import KeyboardRoundedIcon from "@mui/icons-material/KeyboardRounded"
import QrCodeScannerRoundedIcon from "@mui/icons-material/QrCodeScannerRounded"
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded"
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import Divider from "@mui/material/Divider"
import InputAdornment from "@mui/material/InputAdornment"
import MenuItem from "@mui/material/MenuItem"
import Paper from "@mui/material/Paper"
import Snackbar from "@mui/material/Snackbar"
import Stack from "@mui/material/Stack"
import Tab from "@mui/material/Tab"
import Tabs from "@mui/material/Tabs"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { openDB, type IDBPDatabase } from "idb"
import { useCallback, useEffect, useState } from "react"
import { QrScanner } from "@/components/scanner/QrScanner"
import { ScanResult } from "@/components/scanner/ScanResult"
import type { ApiResponse, AssignedEvent, CheckinResult } from "@/types"

type OfflineCheckin = {
  id?: number
  token: string
  gateName: string
  timestamp: string
}

type ScanEntry = {
  name: string
  status: "SUCCESS" | "DUPLICATE" | "INVALID"
  time: string
  sub: string
}

let dbPromise: Promise<IDBPDatabase> | null = null

function getOfflineDb() {
  if (!dbPromise) {
    dbPromise = openDB("qr-attendance-offline", 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("checkin-queue")) {
          database.createObjectStore("checkin-queue", {
            keyPath: "id",
            autoIncrement: true,
          })
        }
      },
    })
  }
  return dbPromise
}

const DOT_COLOR: Record<ScanEntry["status"], string> = {
  SUCCESS: "success.main",
  DUPLICATE: "warning.main",
  INVALID: "error.main",
}

export function ScannerPageClient({ assignedEvents }: { assignedEvents: AssignedEvent[] }) {
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [gateNameDraft, setGateNameDraft] = useState("")
  const [gateName, setGateName] = useState("")
  const [gateActive, setGateActive] = useState(false)
  const [result, setResult] = useState<CheckinResult | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [online, setOnline] = useState(true)
  const [recentScans, setRecentScans] = useState<ScanEntry[]>([])
  const [busy, setBusy] = useState(false)
  const [shortCodeDraft, setShortCodeDraft] = useState("")
  const [tab, setTab] = useState(0)

  useEffect(() => {
    if (assignedEvents.length === 1) setSelectedEventId(assignedEvents[0].id)
  }, [assignedEvents])

  const flushQueue = useCallback(async () => {
    const db = await getOfflineDb()
    const all = await db.getAll("checkin-queue")
    let synced = 0
    for (const entry of all as OfflineCheckin[]) {
      const res = await fetch("/api/scanner/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: entry.token, gateName: entry.gateName }),
      }).catch(() => null)
      // Remove if processed (ok) or already checked in (409) — don't retry indefinitely
      const processed = res && (res.ok || res.status === 409)
      if (processed && typeof entry.id === "number") {
        await db.delete("checkin-queue", entry.id)
        if (res.ok) synced++
      }
    }
    if (synced > 0) setMessage(`${synced} offline check-in${synced > 1 ? "s" : ""} synced`)
  }, [])

  useEffect(() => {
    setOnline(window.navigator.onLine)
    const handleOnline = () => {
      setOnline(true)
      void flushQueue()
    }
    const handleOffline = () => setOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [flushQueue])

  const assignedEvent = assignedEvents.find((e) => e.id === selectedEventId) ?? null
  const isEventActive = assignedEvent?.status === "active"

  const playSound = (status: CheckinResult["status"]) => {
    const file =
      status === "SUCCESS"
        ? "/beep-success.mp3"
        : status === "DUPLICATE"
          ? "/beep-duplicate.mp3"
          : "/beep-error.mp3"
    void new Audio(file).play().catch(() => undefined)
  }

  const saveOffline = useCallback(async (token: string, currentGateName: string) => {
    const db = await getOfflineDb()
    await db.add("checkin-queue", {
      token,
      gateName: currentGateName,
      timestamp: new Date().toISOString(),
    } satisfies OfflineCheckin)
  }, [])

  const handleActivate = () => {
    const trimmed = gateNameDraft.trim()
    if (!trimmed) return
    setGateName(trimmed)
    setGateActive(true)
  }

  const handleDeactivate = () => {
    setGateActive(false)
    setGateNameDraft(gateName)
    setResult(null)
    setBusy(false)
    setRecentScans([])
  }

  const handleDecode = useCallback(
    async (decodedText: string) => {
      if (busy) return
      const token = decodedText.replace("attendance://", "")
      setBusy(true)
      // Always queue to IDB first so the scan is never lost
      await saveOffline(token, gateName)
      // Then attempt immediate sync
      const res = await fetch("/api/scanner/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, gateName }),
      }).catch(() => null)
      if (!res) {
        setMessage("Saved offline — will sync when reconnected")
      } else if (!res.ok) {
        const err = (await res.json()) as ApiResponse<unknown>
        if (err.error === "INVALID_TOKEN") {
          // Invalid token — remove from queue, nothing to sync
          const db = await getOfflineDb()
          const all = await db.getAll("checkin-queue") as OfflineCheckin[]
          const entry = all.slice().reverse().find((e: OfflineCheckin) => e.token === token)
          if (entry?.id !== undefined) await db.delete("checkin-queue", entry.id)
          setResult({ status: "INVALID" })
          playSound("INVALID")
        }
      } else {
        const json = (await res.json()) as ApiResponse<CheckinResult>
        if (json.data) {
          const checkin = json.data
          // Successfully synced — remove from queue
          const db = await getOfflineDb()
          const all = await db.getAll("checkin-queue") as OfflineCheckin[]
          const entry = all.slice().reverse().find((e: OfflineCheckin) => e.token === token)
          if (entry?.id !== undefined) await db.delete("checkin-queue", entry.id)
          setResult(checkin)
          playSound(checkin.status)
          setRecentScans((prev) =>
            [
              {
                name: checkin.attendee?.name ?? "Unknown",
                status: checkin.status,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                sub:
                  checkin.status === "DUPLICATE"
                    ? "Already checked in"
                    : checkin.status === "INVALID"
                      ? "Invalid QR"
                      : "Checked in",
              },
              ...prev,
            ].slice(0, 20),
          )
        }
      }
      window.setTimeout(() => {
        setResult(null)
        setBusy(false)
      }, 3500)
    },
    [busy, gateName, saveOffline],
  )

  const handleShortCode = async () => {
    const code = shortCodeDraft.trim().toUpperCase()
    if (!code || busy) return
    setShortCodeDraft("")
    setBusy(true)
    try {
      const res = await fetch("/api/scanner/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortCode: code, gateName }),
      })
      if (!res.ok) {
        const err = (await res.json()) as ApiResponse<unknown>
        if (err.error === "INVALID_TOKEN") {
          setResult({ status: "INVALID" })
          playSound("INVALID")
        }
      } else {
        const json = (await res.json()) as ApiResponse<CheckinResult>
        if (json.data) {
          const checkin = json.data
          setResult(checkin)
          playSound(checkin.status)
          setRecentScans((prev) =>
            [
              {
                name: checkin.attendee?.name ?? "Unknown",
                status: checkin.status,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                sub: checkin.status === "DUPLICATE" ? "Already checked in" : checkin.status === "INVALID" ? "Invalid code" : "Checked in",
              },
              ...prev,
            ].slice(0, 20),
          )
        }
      }
    } catch {
      setMessage("Offline — short code entry requires connection")
    }
    window.setTimeout(() => { setResult(null); setBusy(false) }, 3500)
  }

  /* ── Gate Setup Screen ─────────────────────────────────────────── */
  if (!gateActive) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
          px: 2,
        }}
      >
        <Paper
          sx={{
            p: { xs: 4, sm: 6 },
            width: "100%",
            maxWidth: 420,
            textAlign: "center",
          }}
        >
          {/* Icon badge */}
          <Box
            sx={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
            }}
          >
            <QrCodeScannerRoundedIcon sx={{ fontSize: 34, color: "#fff" }} />
          </Box>

          <Typography
            variant="h5"
            fontWeight={700}
            letterSpacing="-0.03em"
            mb={0.75}
          >
            Gate Scanner
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={4}>
            Name your checkpoint before scanning begins
          </Typography>

          {assignedEvents.length === 0 && (
            <Box sx={{ mb: 3, p: 2, bgcolor: "warning.light", borderRadius: 1 }}>
              <Typography variant="body2" color="warning.dark">
                You are not assigned to any event. Contact an admin.
              </Typography>
            </Box>
          )}

          {assignedEvents.length > 1 && (
            <TextField
              fullWidth
              label="Select Event"
              select
              size="small"
              sx={{ mb: 2 }}
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              {assignedEvents.map((ev) => (
                <MenuItem key={ev.id} value={ev.id}>
                  {ev.title}
                </MenuItem>
              ))}
            </TextField>
          )}

          {assignedEvent && (
            <Box sx={{ mb: 3, p: 2, bgcolor: "action.hover", borderRadius: 1, textAlign: "left" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>
                ASSIGNED EVENT
              </Typography>
              <Typography variant="body2" fontWeight={700}>{assignedEvent.title}</Typography>
              <Typography variant="caption" color="text.secondary">{assignedEvent.location}</Typography>
            </Box>
          )}

          <TextField
            fullWidth
            autoFocus
            disabled={!isEventActive}
            label="Gate Name"
            placeholder="e.g. Main Entrance, Hall A, VIP"
            value={gateNameDraft}
            onChange={(e) => setGateNameDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && isEventActive && handleActivate()}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <DoorFrontOutlinedIcon
                      fontSize="small"
                      sx={{ color: "text.disabled" }}
                    />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 2 }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            disabled={!isEventActive || !gateNameDraft.trim()}
            onClick={handleActivate}
            sx={{ py: 1.5, fontWeight: 700, letterSpacing: "0.05em", fontSize: 14 }}
          >
            ACTIVATE GATE
          </Button>

          {!online && (
            <Chip
              icon={<WifiOffRoundedIcon fontSize="small" />}
              label="Offline — check-ins will queue locally"
              color="warning"
              size="small"
              sx={{ mt: 3 }}
            />
          )}
        </Paper>
      </Box>
    )
  }

  /* ── Active Scanning Screen ────────────────────────────────────── */
  return (
    <Stack spacing={2.5}>
      {/* Status bar */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: online ? "success.main" : "warning.main",
              boxShadow: online
                ? "0 0 0 3px rgba(34,197,94,0.2)"
                : "0 0 0 3px rgba(245,158,11,0.2)",
            }}
          />
          <Typography variant="body2" fontWeight={700} letterSpacing="-0.01em">
            {gateName}
          </Typography>
        </Box>

        {!online && (
          <Chip
            icon={<WifiOffRoundedIcon fontSize="small" />}
            label="Offline"
            color="warning"
            size="small"
          />
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Button
          size="small"
          variant="outlined"
          startIcon={<SwapHorizRoundedIcon />}
          onClick={handleDeactivate}
          sx={{ color: "text.secondary", borderColor: "divider" }}
        >
          Change Gate
        </Button>
      </Box>

      {/* Tab switcher */}
      <Paper sx={{ overflow: "hidden" }}>
        <Tabs
          value={tab}
          onChange={(_, v: number) => setTab(v)}
          variant="fullWidth"
          sx={{ borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Tab icon={<QrCodeScannerRoundedIcon fontSize="small" />} iconPosition="start" label="Scan" />
          <Tab
            icon={<HistoryRoundedIcon fontSize="small" />}
            iconPosition="start"
            label={recentScans.length > 0 ? `History (${recentScans.length})` : "History"}
          />
        </Tabs>

        {/* Scan tab */}
        {tab === 0 && (
          <Stack spacing={1.5} sx={{ p: 2 }}>
            <Box sx={{ position: "relative", borderRadius: 1, overflow: "hidden" }}>
              <QrScanner busy={busy} onDecode={handleDecode} />
              {result && (
                <Box sx={{ position: "absolute", inset: 0, zIndex: 10 }}>
                  <ScanResult result={result} />
                </Box>
              )}
            </Box>

            <TextField
              fullWidth
              size="small"
              placeholder="Short code (e.g. AB3X7K)"
              value={shortCodeDraft}
              disabled={busy}
              onChange={(e) => setShortCodeDraft(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && void handleShortCode()}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyboardRoundedIcon fontSize="small" sx={{ color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        variant="contained"
                        disabled={busy || !shortCodeDraft.trim()}
                        onClick={() => void handleShortCode()}
                        sx={{ minWidth: 64, bgcolor: "#0a0a0a", "&:hover": { bgcolor: "#222" } }}
                      >
                        Check In
                      </Button>
                    </InputAdornment>
                  ),
                  sx: { fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase" },
                },
              }}
            />
          </Stack>
        )}

        {/* History tab */}
        {tab === 1 && (
          <Box sx={{ overflowY: "auto", maxHeight: 520 }}>
            {recentScans.length === 0 ? (
              <Box sx={{ px: 2.5, py: 6, textAlign: "center" }}>
                <HistoryRoundedIcon sx={{ fontSize: 32, color: "text.disabled", mb: 1, opacity: 0.4 }} />
                <Typography variant="body2" color="text.disabled">
                  No scans yet
                </Typography>
              </Box>
            ) : (
              recentScans.map((entry, i) => (
                <Box key={`${entry.time}-${i}`}>
                  <Box
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      "&:hover": { bgcolor: "action.hover" },
                      transition: "background-color 0.15s",
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        flexShrink: 0,
                        bgcolor: DOT_COLOR[entry.status],
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ lineHeight: 1.35 }}>
                        {entry.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {entry.sub}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ fontVariantNumeric: "tabular-nums", flexShrink: 0 }}
                    >
                      {entry.time}
                    </Typography>
                  </Box>
                  {i < recentScans.length - 1 && <Divider />}
                </Box>
              ))
            )}
          </Box>
        )}
      </Paper>

      <Snackbar
        autoHideDuration={4000}
        onClose={() => setMessage(null)}
        open={Boolean(message)}
      >
        <Alert onClose={() => setMessage(null)} severity="info" variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
