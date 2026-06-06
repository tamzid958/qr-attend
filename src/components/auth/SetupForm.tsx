"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
})

type FormValues = z.infer<typeof schema>

export function SetupForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    const json = (await res.json()) as { ok?: boolean; error?: string }
    if (!res.ok) {
      if (res.status === 409) {
        router.replace("/login")
        return
      }
      setError(json.error ?? "Something went wrong. Please try again.")
      return
    }
    setDone(true)
  })

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      {/* Dark brand panel */}
      <Box
        sx={{
          bgcolor: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: { xs: 4, md: 6 },
          py: { xs: 5, md: 0 },
          width: { xs: "100%", md: "45%" },
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: "20px", md: "24px" },
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#fff",
          }}
        >
          QR Attend
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: "9px", md: "10px" },
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.3)",
            mt: 0.5,
          }}
        >
          Event Operations
        </Typography>
        <Typography
          sx={{
            mt: { xs: 2, md: 4 },
            fontSize: { xs: "22px", md: "32px" },
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            color: "#fff",
          }}
        >
          First-time
          <br />
          setup.
        </Typography>
        <Typography
          sx={{
            mt: 2,
            fontSize: "14px",
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.6,
            display: { xs: "none", md: "block" },
          }}
        >
          Create your administrator account to get started. You can add more users from the dashboard.
        </Typography>
      </Box>

      {/* White form panel */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 3, md: 6 },
          py: { xs: 6, md: 0 },
          bgcolor: "background.paper",
        }}
      >
        {done ? (
          <Stack spacing={2} sx={{ width: "100%", maxWidth: 380 }}>
            <Alert severity="success" variant="filled">
              Admin account created! Check your email for a sign-in link.
            </Alert>
            <Button
              fullWidth
              size="large"
              variant="outlined"
              onClick={() => router.replace("/login")}
            >
              Go to Sign In
            </Button>
          </Stack>
        ) : (
          <Stack
            component="form"
            onSubmit={onSubmit}
            spacing={2.5}
            sx={{ width: "100%", maxWidth: 380 }}
          >
            <div>
              <Typography
                sx={{ fontWeight: 800, fontSize: "24px", letterSpacing: "-0.02em" }}
              >
                Create admin account
              </Typography>
              <Typography color="text.secondary" mt={0.75} variant="body2">
                This runs once. After setup, sign in via the magic-link email we&apos;ll send you.
              </Typography>
            </div>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Full name"
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              {...register("name")}
            />
            <TextField
              label="Work email"
              type="email"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register("email")}
            />
            <Button
              disabled={isSubmitting}
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              sx={{ bgcolor: "#0a0a0a", "&:hover": { bgcolor: "#222" } }}
            >
              {isSubmitting ? "Creating account…" : "Create Admin Account"}
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  )
}
