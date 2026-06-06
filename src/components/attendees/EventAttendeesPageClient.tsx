"use client"

import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import IconButton from "@mui/material/IconButton"
import LinearProgress from "@mui/material/LinearProgress"
import MenuItem from "@mui/material/MenuItem"
import Snackbar from "@mui/material/Snackbar"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useState } from "react"
import { AttendeeGrid } from "@/components/attendees/AttendeeGrid"
import { UploadZone } from "@/components/attendees/UploadZone"
import type { ApiResponse, EventAttendeeRow, SendQrResponse } from "@/types"

const EMPTY_FORM = { name: "", email: "", phone: "" }

export function EventAttendeesPageClient({ eventId }: { eventId: string }) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [sendingQr, setSendingQr] = useState(false)
  const [qrMessage, setQrMessage] = useState<string | null>(null)
  const [gridKey, setGridKey] = useState(0)

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Edit dialog
  const [editRow, setEditRow] = useState<EventAttendeeRow | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  // Delete dialog
  const [deleteRow, setDeleteRow] = useState<EventAttendeeRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Send QR confirmation
  const [qrConfirmOpen, setQrConfirmOpen] = useState(false)

  const sendQr = async () => {
    setQrConfirmOpen(false)
    setSendingQr(true)
    const body = selectedIds.length > 0 ? { ids: selectedIds } : {}
    const json = (await (
      await fetch(`/api/events/${eventId}/attendees/send-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    ).json()) as ApiResponse<SendQrResponse>
    setSendingQr(false)
    if (json.data) {
      setQrMessage(`Sent to ${json.data.sent} attendee${json.data.sent !== 1 ? "s" : ""}${json.data.failed > 0 ? `, ${json.data.failed} failed` : ""}`)
    } else {
      setQrMessage(json.error ?? "Send failed")
    }
  }

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setAddOpen(true)
  }

  const saveAttendee = async () => {
    setSaving(true)
    setFormError(null)
    const res = await fetch(`/api/events/${eventId}/attendees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const json = (await res.json()) as ApiResponse<unknown>
    setSaving(false)
    if (json.error) {
      setFormError(json.error)
    } else {
      setAddOpen(false)
      setGridKey((k) => k + 1)
    }
  }

  const openEdit = (row: EventAttendeeRow) => {
    setEditRow(row)
    setEditForm({ name: row.attendee.name, email: row.attendee.email, phone: row.attendee.phone })
    setEditError(null)
    setEditSaving(false)
  }

  const saveEdit = async () => {
    if (!editRow) return
    setEditSaving(true)
    setEditError(null)
    const res = await fetch(`/api/events/${eventId}/attendees/${editRow.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    })
    const json = (await res.json()) as ApiResponse<unknown>
    setEditSaving(false)
    if (json.error) {
      setEditError(json.error)
    } else {
      setEditRow(null)
      setGridKey((k) => k + 1)
    }
  }

  const openDelete = (row: EventAttendeeRow) => {
    setDeleteRow(row)
    setDeleteError(null)
    setDeleting(false)
  }

  const confirmDelete = async () => {
    if (!deleteRow) return
    setDeleting(true)
    setDeleteError(null)
    const res = await fetch(`/api/events/${eventId}/attendees/${deleteRow.id}`, { method: "DELETE" })
    const json = (await res.json()) as ApiResponse<unknown>
    setDeleting(false)
    if (json.error) {
      setDeleteError(json.error)
    } else {
      setDeleteRow(null)
      setGridKey((k) => k + 1)
    }
  }

  const exportCsv = () => {
    window.location.href = `/api/events/${eventId}/attendees/export?format=csv`
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
          mb: 2,
          position: "relative",
        }}
      >
        <TextField
          label="Search"
          size="small"
          sx={{ minWidth: 200 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <TextField
          label="Status"
          select
          size="small"
          sx={{ minWidth: 140 }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="REGISTERED">Registered</MenuItem>
          <MenuItem value="INVITED">Invited</MenuItem>
          <MenuItem value="PRESENT">Present</MenuItem>
          <MenuItem value="ABSENT">Absent</MenuItem>
        </TextField>

        <Box sx={{ flexGrow: 1 }} />

        <Button onClick={exportCsv} size="small" variant="outlined">Export</Button>
        <Button disabled={sendingQr} onClick={() => setQrConfirmOpen(true)} size="small" variant="outlined">
          {selectedIds.length > 0 ? `Send QR (${selectedIds.length})` : "Send QR"}
        </Button>
        <Button onClick={() => setUploadOpen(true)} size="small" variant="outlined">Upload CSV</Button>
        <Button onClick={openAdd} size="small" variant="contained">Add Attendee</Button>

        {sendingQr && (
          <LinearProgress sx={{ position: "absolute", bottom: -8, left: 0, right: 0 }} />
        )}
      </Box>

      <AttendeeGrid
        key={gridKey}
        eventId={eventId}
        search={search}
        status={status}
        onSelectionChange={setSelectedIds}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      {/* Manual add dialog */}
      <Dialog fullWidth maxWidth="xs" onClose={() => setAddOpen(false)} open={addOpen}>
        <DialogTitle>Add Attendee</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            label="Name"
            size="small"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <TextField
            label="Email"
            size="small"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <TextField
            label="Phone"
            size="small"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            required
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)} size="small">Cancel</Button>
          <Button
            onClick={saveAttendee}
            disabled={saving || !form.name || !form.email || !form.phone}
            size="small"
            variant="contained"
          >
            {saving ? "Saving…" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog fullWidth maxWidth="xs" onClose={() => setEditRow(null)} open={Boolean(editRow)}>
        <DialogTitle>Edit Attendee</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          {editError && <Alert severity="error">{editError}</Alert>}
          <TextField
            label="Name"
            size="small"
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <TextField
            label="Email"
            size="small"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <TextField
            label="Phone"
            size="small"
            value={editForm.phone}
            onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
            required
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditRow(null)} size="small">Cancel</Button>
          <Button
            onClick={saveEdit}
            disabled={editSaving || !editForm.name || !editForm.email || !editForm.phone}
            size="small"
            variant="contained"
          >
            {editSaving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog fullWidth maxWidth="xs" onClose={() => setDeleteRow(null)} open={Boolean(deleteRow)}>
        <DialogTitle>Delete Attendee</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 1 }}>{deleteError}</Alert>}
          <Typography>
            Remove <strong>{deleteRow?.attendee.name}</strong> from this event? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteRow(null)} size="small">Cancel</Button>
          <Button
            onClick={confirmDelete}
            disabled={deleting}
            size="small"
            variant="contained"
            color="error"
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send QR confirmation dialog */}
      <Dialog fullWidth maxWidth="xs" onClose={() => setQrConfirmOpen(false)} open={qrConfirmOpen}>
        <DialogTitle>Send QR Codes</DialogTitle>
        <DialogContent>
          <Typography>
            {selectedIds.length > 0
              ? `Send QR codes to ${selectedIds.length} selected attendee${selectedIds.length !== 1 ? "s" : ""}?`
              : "Send QR codes to all attendees for this event?"}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setQrConfirmOpen(false)} size="small">Cancel</Button>
          <Button onClick={sendQr} size="small" variant="contained">Send</Button>
        </DialogActions>
      </Dialog>

      {/* CSV upload dialog */}
      <Dialog fullWidth maxWidth="md" onClose={() => setUploadOpen(false)} open={uploadOpen} slotProps={{ backdrop: { sx: { backdropFilter: "blur(2px)" } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1.5 }}>
          Upload Attendees
          <IconButton onClick={() => setUploadOpen(false)} size="small">
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important" }}>
          <UploadZone
            eventId={eventId}
            onSuccess={() => {
              setUploadOpen(false)
              setGridKey((k) => k + 1)
            }}
          />
        </DialogContent>
      </Dialog>

      <Snackbar autoHideDuration={4000} onClose={() => setQrMessage(null)} open={Boolean(qrMessage)}>
        <Alert onClose={() => setQrMessage(null)} severity="info" variant="filled">{qrMessage}</Alert>
      </Snackbar>
    </>
  )
}
