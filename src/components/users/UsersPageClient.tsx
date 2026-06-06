"use client"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import { useEffect, useState } from "react"
import { UserFormDialog } from "@/components/users/UserFormDialog"
import { UsersTable } from "@/components/users/UsersTable"
import type { ApiResponse, UserRow } from "@/types"

export function UsersPageClient() {
  const [rows, setRows] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<UserRow | null>(null)

  const fetchRows = async () => {
    setLoading(true)
    const json = (await (await fetch("/api/users")).json()) as ApiResponse<UserRow[]>
    if (json.data) setRows(json.data)
    setLoading(false)
  }

  useEffect(() => { void fetchRows() }, [])

  const openCreate = () => { setEditTarget(null); setDialogOpen(true) }
  const openEdit = (user: UserRow) => { setEditTarget(user); setDialogOpen(true) }

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button onClick={openCreate} size="small" variant="contained">New User</Button>
      </Box>

      <UsersTable loading={loading} rows={rows} onDeleted={fetchRows} onEdit={openEdit} />

      <UserFormDialog
        user={editTarget}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={fetchRows}
      />
    </>
  )
}
