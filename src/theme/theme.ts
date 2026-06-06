import { createTheme } from "@mui/material/styles"

export const ibmPlexSans = {
  className: "",
  style: {
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
  },
}

const fontFamily = ibmPlexSans.style.fontFamily

const components = {
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
  },
  MuiCard: {
    defaultProps: {
      variant: "outlined" as const,
    },
  },
}

export const dataGridHeaderSx = {
  "& .MuiDataGrid-columnHeaderTitle": {
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
} as const

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2563EB" },
    secondary: { main: "#00897B" },
    success: { main: "#22c55e" },
    warning: { main: "#f59e0b" },
    background: { default: "#f9f9f9", paper: "#ffffff" },
  },
  typography: { fontFamily },
  shape: { borderRadius: 4 },
  components,
})

