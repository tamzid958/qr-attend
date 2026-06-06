"use client"

import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded"
import EditRoundedIcon from "@mui/icons-material/EditRounded"
import Chip from "@mui/material/Chip"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"
import { DataGrid, type GridColDef } from "@mui/x-data-grid"
import type { UserRow } from "@/types"
import { dataGridHeaderSx } from "@/theme/theme"

type Props = {
  rows: UserRow[]
  loading: boolean
  onEdit: (user: UserRow) => void
  onDeleted: () => void
}

export function UsersTable({ rows, loading, onEdit, onDeleted }: Props) {
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
    if (res.ok) onDeleted()
  }

  const columns: GridColDef<UserRow>[] = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1.2 },
    {
      field: "role",
      headerName: "Role",
      flex: 0.7,
      renderCell: (params) => (
        <Chip
          color={params.value === "ADMIN" ? "primary" : "default"}
          label={params.value === "ADMIN" ? "Admin" : "Scanner"}
          size="small"
        />
      ),
    },
    {
      field: "createdAt",
      headerName: "Created",
      flex: 0.9,
      valueFormatter: (value: string) =>
        new Date(value).toLocaleDateString("en-US", { dateStyle: "medium" }),
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      width: 100,
      renderCell: (params) => (
        <>
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
      rows={rows}
      sx={dataGridHeaderSx}
    />
  )
}
