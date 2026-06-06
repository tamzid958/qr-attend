"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Snackbar from "@mui/material/Snackbar"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { signIn } from "next-auth/react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
})

type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const router = useRouter()
  const { status } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (status === "authenticated") router.replace("/")
  }, [router, status])

  const onSubmit = handleSubmit(async (values) => {
    const result = await signIn("nodemailer", {
      email: values.email,
      redirect: false,
      callbackUrl: "/",
    })
    if (result?.error) {
      setSuccess(null)
      setError("We couldn't send a sign-in link for that email.")
      return
    }
    setError(null)
    setSuccess("Check your email for a secure sign-in link.")
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
          Check-in,
          <br />
          at scale.
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
          Real-time QR attendance tracking for events of any size. Offline-capable and built for speed.
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
              Welcome back
            </Typography>
            <Typography color="text.secondary" mt={0.75} variant="body2">
              Enter your work email and we&apos;ll send you a passwordless sign-in link.
            </Typography>
          </div>
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
            Send Sign-in Link
          </Button>
        </Stack>
      </Box>

      <Snackbar
        autoHideDuration={4000}
        onClose={() => setError(null)}
        open={Boolean(error)}
      >
        <Alert onClose={() => setError(null)} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        autoHideDuration={5000}
        onClose={() => setSuccess(null)}
        open={Boolean(success)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" variant="filled">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  )
}
