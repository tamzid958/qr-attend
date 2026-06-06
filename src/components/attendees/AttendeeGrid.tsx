"use client"

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import Chip from "@mui/material/Chip"
import IconButton from "@mui/material/IconButton"
import { DataGrid, type GridColDef, type GridRowSelectionModel } from "@mui/x-data-grid"
import { useEffect, useState } from "react"
import type { ApiResponse, EventAttendeeRow, PagedEventAttendeesResponse } from "@/types"
import { attendeeStatusColor, attendeeStatusLabel } from "@/lib/attendee-status"
import { dataGridHeaderSx } from "@/theme/theme"

type Props = {
  eventId: string
  search: string
  status: string
  onSelectionChange?: (ids: string[]) => void
  onEdit?: (row: EventAttendeeRow) => void
  onDelete?: (row: EventAttendeeRow) => void
}

export function AttendeeGrid({ eventId, search, status, onSelectionChange, onEdit, onDelete }: Props) {
  const [rows, setRows] = useState<EventAttendeeRow[]>([])
  const [loading, setLoading] = useState(false)
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({ type: "include", ids: new Set() })

  useEffect(() => {
    let cancelled = false
    const fetchRows = async () => {
      setLoading(true)
      const params = new URLSearchParams({ all: "true" })
      if (search) params.set("search", search)
      if (status) params.set("status", status)
      const json = (await (
        await fetch(`/api/events/${eventId}/attendees?${params}`)
      ).json()) as ApiResponse<PagedEventAttendeesResponse>
      if (!cancelled && json.data) setRows(json.data.data)
      if (!cancelled) setLoading(false)
    }
    void fetchRows()
    return () => { cancelled = true }
  }, [eventId, search, status])

  const handleSelectionChange = (model: GridRowSelectionModel) => {
    setSelectionModel(model)
    if (onSelectionChange) {
      const ids = model.type === "include"
        ? Array.from(model.ids as Set<string>)
        : rows.map((r) => r.id).filter((id) => !(model.ids as Set<string>).has(id))
      onSelectionChange(ids)
    }
  }

  const columns: GridColDef<EventAttendeeRow>[] = [
    { field: "name", headerName: "Name", flex: 1, valueGetter: (_v: unknown, row: EventAttendeeRow) => row.attendee.name },
    { field: "email", headerName: "Email", flex: 1.2, valueGetter: (_v: unknown, row: EventAttendeeRow) => row.attendee.email },
    { field: "phone", headerName: "Phone", flex: 1, valueGetter: (_v: unknown, row: EventAttendeeRow) => row.attendee.phone },
    {
      field: "status",
      headerName: "Status",
      flex: 0.9,
      renderCell: (params) => (
        <Chip
          color={attendeeStatusColor(params.value as string)}
          label={attendeeStatusLabel(params.value as string)}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 80,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <>
          <IconButton size="small" onClick={() => onEdit?.(params.row)} title="Edit">
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete?.(params.row)} title="Delete" color="error">
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ]

  return (
    <>
      <DataGrid
        autoHeight
        checkboxSelection
        columns={columns}
        density="compact"
        disableRowSelectionOnClick
        loading={loading}
        pageSizeOptions={[20, 50, 100]}
        pagination
        rowSelectionModel={selectionModel}
        rows={rows}
        sx={dataGridHeaderSx}
        onRowSelectionModelChange={handleSelectionChange}
      />
    </>
  )
}
