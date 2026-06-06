"use client"

import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded"
import EditRoundedIcon from "@mui/icons-material/EditRounded"
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded"
import Chip from "@mui/material/Chip"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"
import { DataGrid, type GridColDef } from "@mui/x-data-grid"
import { useRouter } from "next/navigation"
import type { EventRow } from "@/types"
import { dataGridHeaderSx } from "@/theme/theme"

type Props = {
  rows: EventRow[]
  loading: boolean
  rowCount: number
  page: number
  pageSize: number
  onPaginationChange: (page: number, pageSize: number) => void
  onEdit: (event: EventRow) => void
  onDeleted: () => void
}

export function EventsTable({
  rows,
  loading,
  rowCount,
  page,
  pageSize,
  onPaginationChange,
  onEdit,
  onDeleted,
}: Props) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event and all its attendee registrations?")) return
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" })
    if (res.ok) onDeleted()
  }

  const columns: GridColDef<EventRow>[] = [
    { field: "title", headerName: "Title", flex: 1.5 },
    { field: "location", headerName: "Location", flex: 1 },
    {
      field: "startDate",
      headerName: "Start",
      flex: 1,
      valueFormatter: (value: string) =>
        new Date(value).toLocaleDateString("en-US", { dateStyle: "medium" }),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.7,
      renderCell: (params) => (
        <Chip
          color={params.value === "active" ? "success" : "default"}
          label={params.value === "active" ? "Active" : "Inactive"}
          size="small"
        />
      ),
    },
    {
      field: "_count",
      headerName: "Attendees",
      flex: 0.7,
      valueGetter: (_value: unknown, row: EventRow) => row._count?.eventAttendees ?? 0,
    },
    {
      field: "assignedScanners",
      headerName: "Scanners",
      flex: 1.2,
      valueGetter: (_value: unknown, row: EventRow) =>
        row.assignedScanners.map((s) => s.user.name).join(", ") || "—",
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      width: 120,
      renderCell: (params) => (
        <>
          <Tooltip title="View Attendees">
            <IconButton size="small" onClick={() => router.push(`/events/${params.row.id}/attendees`)}>
              <PeopleAltRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(params.row)}>
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDelete(params.row.id)}>
              <DeleteRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ]

  return (
    <DataGrid
      autoHeight
      columns={columns}
      density="compact"
      loading={loading}
      pageSizeOptions={[10, 20, 50]}
      pagination
      paginationMode="server"
      rowCount={rowCount}
      rows={rows}
      sx={dataGridHeaderSx}
      onPaginationModelChange={(model) => onPaginationChange(model.page, model.pageSize)}
    />
  )
}
