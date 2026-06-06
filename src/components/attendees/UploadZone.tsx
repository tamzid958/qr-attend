"use client"

import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined"
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import CircularProgress from "@mui/material/CircularProgress"
import Snackbar from "@mui/material/Snackbar"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { DataGrid, type GridColDef } from "@mui/x-data-grid"
import { useRef, useState } from "react"
import type { ApiResponse, UploadPreviewResponse, UploadPreviewRow } from "@/types"
import { dataGridHeaderSx } from "@/theme/theme"

type Stage = "idle" | "parsing" | "preview" | "confirming"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const columns: GridColDef<UploadPreviewRow>[] = [
  { field: "row", headerName: "#", width: 60 },
  { field: "name", headerName: "Name", flex: 1.2 },
  { field: "email", headerName: "Email", flex: 1.5 },
  { field: "phone", headerName: "Phone", flex: 1 },
  {
    field: "status",
    headerName: "Status",
    width: 110,
    renderCell: (params) => {
      if (params.row.error)
        return <Chip color="error" label="Error" size="small" variant="outlined" />
      if (params.row.duplicate)
        return <Chip color="warning" label="Duplicate" size="small" variant="outlined" />
      return <Chip color="success" label="Valid" size="small" variant="outlined" />
    },
  },
  {
    field: "error",
    headerName: "Details",
    flex: 1.2,
    renderCell: (params) => (
      <Typography color="error.main" sx={{ fontSize: 12 }} variant="body2">
        {params.row.error ?? ""}
      </Typography>
    ),
  },
]

export function UploadZone({
  eventId,
  onSuccess,
}: {
  eventId: string
  onSuccess?: () => void
}) {
  const [stage, setStage] = useState<Stage>("idle")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<UploadPreviewResponse | null>(null)
  const [dragging, setDragging] = useState(false)
  const [snackbar, setSnackbar] = useState<{ msg: string; severity: "success" | "error" } | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const processFile = async (selected: File) => {
    setFile(selected)
    setStage("parsing")
    const formData = new FormData()
    formData.append("file", selected)
    const json = (await (
      await fetch(`/api/events/${eventId}/attendees/upload`, { method: "POST", body: formData })
    ).json()) as ApiResponse<UploadPreviewResponse>
    if (json.data) {
      setPreview(json.data)
      setStage("preview")
    } else {
      setSnackbar({ msg: json.error ?? "Could not parse file", severity: "error" })
      setStage("idle")
      setFile(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) void processFile(dropped)
  }

  const confirmUpload = async () => {
    if (!file) return
    setStage("confirming")
    const formData = new FormData()
    formData.append("file", file)
    const json = (await (
      await fetch(`/api/events/${eventId}/attendees/upload?confirm=true`, {
        method: "POST",
        body: formData,
      })
    ).json()) as ApiResponse<UploadPreviewResponse>
    if (json.data) {
      setSnackbar({ msg: `${json.data.validCount} attendees imported successfully`, severity: "success" })
      reset()
      onSuccess?.()
    } else {
      setSnackbar({ msg: json.error ?? "Upload failed", severity: "error" })
      setStage("preview")
    }
  }

  const reset = () => {
    setStage("idle")
    setFile(null)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <Stack spacing={3}>
      {/* Drop zone — always visible */}
      {stage === "idle" && (
        <Box
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          sx={{
            border: "2px dashed",
            borderColor: dragging ? "primary.main" : "divider",
            borderRadius: 2,
            p: { xs: 4, sm: 6 },
            textAlign: "center",
            cursor: "pointer",
            bgcolor: dragging ? "action.hover" : "transparent",
            transition: "border-color 0.15s, background-color 0.15s",
            "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              bgcolor: "action.selected",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <CloudUploadOutlinedIcon sx={{ fontSize: 26, color: "text.secondary" }} />
          </Box>
          <Typography fontWeight={700} mb={0.5}>
            Drop your file here or{" "}
            <Box component="span" sx={{ color: "primary.main" }}>
              browse
            </Box>
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            CSV or XLSX · Columns: <code>name</code>, <code>email</code>, <code>phone</code>
          </Typography>
          <input
            ref={inputRef}
            accept=".csv,.xlsx"
            hidden
            type="file"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void processFile(f) }}
          />
        </Box>
      )}

      {/* Parsing spinner */}
      {stage === "parsing" && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6, gap: 2 }}>
          <CircularProgress size={36} />
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            Parsing {file?.name}…
          </Typography>
        </Box>
      )}

      {/* Preview state */}
      {(stage === "preview" || stage === "confirming") && preview && file && (
        <>
          {/* File pill */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                bgcolor: "action.selected",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <InsertDriveFileOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={600} noWrap sx={{ fontSize: 14 }}>
                {file.name}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                {formatBytes(file.size)}
              </Typography>
            </Box>
            <Button disabled={stage === "confirming"} onClick={reset} size="small" variant="text">
              Change
            </Button>
          </Box>

          {/* Stat badges */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              color="success"
              label={`${preview.validCount} valid`}
              size="small"
              sx={{ fontWeight: 700 }}
            />
            {preview.duplicateCount > 0 && (
              <Chip
                color="warning"
                label={`${preview.duplicateCount} duplicate${preview.duplicateCount !== 1 ? "s" : ""}`}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            )}
            {preview.errorCount > 0 && (
              <Chip
                color="error"
                label={`${preview.errorCount} error${preview.errorCount !== 1 ? "s" : ""}`}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>

          {/* Preview grid */}
          <DataGrid
            autoHeight
            columns={columns}
            density="compact"
            disableColumnMenu
            getRowId={(row) => row.row}
            getRowClassName={(params) =>
              params.row.error ? "row-error" : params.row.duplicate ? "row-duplicate" : ""
            }
            hideFooter={preview.rows.length <= 100}
            pageSizeOptions={[25, 50, 100]}
            rows={preview.rows}
            sx={{
              fontSize: 13,
              "& .row-error": { bgcolor: "rgba(239,68,68,0.07)" },
              "& .row-duplicate": { bgcolor: "rgba(234,179,8,0.07)" },
              ...dataGridHeaderSx,
            }}
          />

          {/* Action row */}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              disabled={preview.validCount === 0 || stage === "confirming"}
              onClick={confirmUpload}
              startIcon={stage === "confirming" ? <CircularProgress size={14} /> : undefined}
              variant="contained"
            >
              {stage === "confirming"
                ? "Importing…"
                : `Import ${preview.validCount} attendee${preview.validCount !== 1 ? "s" : ""}`}
            </Button>
          </Box>
        </>
      )}

      <Snackbar
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        open={Boolean(snackbar)}
      >
        <Alert
          onClose={() => setSnackbar(null)}
          severity={snackbar?.severity ?? "info"}
          variant="filled"
        >
          {snackbar?.msg}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
