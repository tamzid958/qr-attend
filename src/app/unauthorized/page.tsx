import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3 }}>
      <Stack alignItems="center" spacing={2}>
        <Typography fontWeight={700} variant="h2">
          403
        </Typography>
        <Typography variant="h5">Access Denied</Typography>
        <Link href="/" style={{ textDecoration: "none" }}>
          <Button variant="contained">Back to Home</Button>
        </Link>
      </Stack>
    </Box>
  )
}
