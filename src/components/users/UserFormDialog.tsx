"use client"

import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import MenuItem from "@mui/material/MenuItem"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import { useEffect, useState } from "react"
import { Role } from "@/types"
import type { UserRow } from "@/types"

type FormState = { name: string; email: string; role: Role }
const EMPTY: FormState = { name: "", email: "", role: Role.SCANNER }

export function UserFormDialog({
  open,
  user,
  onClose,
  onSaved,
}: {
  open: boolean
  user?: UserRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(user ? { name: user.name, email: user.email, role: user.role as Role } : EMPTY)
    }
  }, [open, user])

  const handleSave = async () => {
    if (!form.name || (!user && !form.email)) return
    setSaving(true)
    const url = user ? `/api/users/${user.id}` : "/api/users"
    const method = user ? "PATCH" : "POST"
    const body = user ? { name: form.name, role: form.role } : form
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>{user ? "Edit User" : "New User"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          {!user && (
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              helperText="User will sign in via magic link sent to this email"
            />
          )}
          <TextField
            label="Role"
            select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
          >
            <MenuItem value={Role.ADMIN}>Admin</MenuItem>
            <MenuItem value={Role.SCANNER}>Scanner</MenuItem>
          </TextField>
        </Stack>
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
