"use client"

import Button from "@mui/material/Button"
import Checkbox from "@mui/material/Checkbox"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import FormControl from "@mui/material/FormControl"
import InputLabel from "@mui/material/InputLabel"
import ListItemText from "@mui/material/ListItemText"
import MenuItem from "@mui/material/MenuItem"
import OutlinedInput from "@mui/material/OutlinedInput"
import Select from "@mui/material/Select"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { useEffect, useState } from "react"
import type { ApiResponse, EventRow, UserRow } from "@/types"

type FormState = {
  title: string
  location: string
  status: string
  startDate: Date | null
  endDate: Date | null
  scannerIds: string[]
}

const EMPTY: FormState = {
  title: "",
  location: "",
  status: "active",
  startDate: null,
  endDate: null,
  scannerIds: [],
}

export function EventFormDialog({
  open,
  event,
  onClose,
  onSaved,
}: {
  open: boolean
  event?: EventRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [scanners, setScanners] = useState<UserRow[]>([])

  useEffect(() => {
    if (open) {
      setForm(
        event
          ? {
              title: event.title,
              location: event.location,
              status: event.status,
              startDate: new Date(event.startDate),
              endDate: new Date(event.endDate),
              scannerIds: event.assignedScanners.map((s) => s.user.id),
            }
          : EMPTY,
      )
      void fetch("/api/users")
        .then((r) => r.json() as Promise<ApiResponse<UserRow[]>>)
        .then((j) => setScanners((j.data ?? []).filter((u) => u.role === "SCANNER")))
    }
  }, [open, event])

  const handleSave = async () => {
    if (!form.title || !form.location || !form.startDate || !form.endDate) return
    setSaving(true)
    const body = {
      title: form.title,
      location: form.location,
      status: form.status,
      startDate: form.startDate.toISOString(),
      endDate: form.endDate.toISOString(),
      scannerIds: form.scannerIds,
    }
    const url = event ? `/api/events/${event.id}` : "/api/events"
    const method = event ? "PATCH" : "POST"
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>{event ? "Edit Event" : "New Event"}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <TextField
              label="Location"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
            <DateTimePicker
              label="Start Date"
              orientation="landscape"
              value={form.startDate}
              onChange={(d) => setForm((f) => ({ ...f, startDate: d }))}
            />
            <DateTimePicker
              label="End Date"
              orientation="landscape"
              value={form.endDate}
              onChange={(d) => setForm((f) => ({ ...f, endDate: d }))}
            />
            <TextField
              label="Status"
              select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
            <FormControl fullWidth>
              <InputLabel>Assigned Scanners</InputLabel>
              <Select
                multiple
                value={form.scannerIds}
                onChange={(e) => setForm((f) => ({ ...f, scannerIds: e.target.value as string[] }))}
                input={<OutlinedInput label="Assigned Scanners" />}
                renderValue={(selected) =>
                  scanners
                    .filter((s) => (selected as string[]).includes(s.id))
                    .map((s) => s.name)
                    .join(", ") || "None"
                }
              >
                {scanners.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    <Checkbox checked={form.scannerIds.includes(s.id)} />
                    <ListItemText primary={s.name} secondary={s.email} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button disabled={saving} onClick={handleSave} variant="contained">
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
