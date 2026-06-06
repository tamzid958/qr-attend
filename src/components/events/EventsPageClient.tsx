"use client"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import { useEffect, useState } from "react"
import { EventFormDialog } from "@/components/events/EventFormDialog"
import { EventsTable } from "@/components/events/EventsTable"
import type { ApiResponse, EventRow, PagedEventsResponse } from "@/types"

export function EventsPageClient() {
  const [search, setSearch] = useState("")
  const [rows, setRows] = useState<EventRow[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [rowCount, setRowCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EventRow | null>(null)

  const fetchRows = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page + 1), limit: String(pageSize) })
    if (search) params.set("search", search)
    const json = (await (await fetch(`/api/events?${params}`)).json()) as ApiResponse<PagedEventsResponse>
    if (json.data) {
      setRows(json.data.data)
      setRowCount(json.data.total)
    }
    setLoading(false)
  }

  useEffect(() => { void fetchRows() }, [page, pageSize, search])

  const openCreate = () => { setEditTarget(null); setDialogOpen(true) }
  const openEdit = (event: EventRow) => { setEditTarget(event); setDialogOpen(true) }

  return (
    <>
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <TextField
          label="Search"
          size="small"
          sx={{ minWidth: 220 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={openCreate} size="small" variant="contained">
          New Event
        </Button>
      </Box>

      <EventsTable
        loading={loading}
        page={page}
        pageSize={pageSize}
        rowCount={rowCount}
        rows={rows}
        onDeleted={fetchRows}
        onEdit={openEdit}
        onPaginationChange={(p, ps) => { setPage(p); setPageSize(ps) }}
      />

      <EventFormDialog
        event={editTarget}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={fetchRows}
      />
    </>
  )
}
