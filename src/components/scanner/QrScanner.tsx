"use client"

import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { keyframes } from "@emotion/react"
import { Html5Qrcode } from "html5-qrcode"
import { useEffect, useRef } from "react"

const scanLine = keyframes`
  0%   { top: 6%;  opacity: 0.9; }
  48%  { top: 88%; opacity: 0.9; }
  50%  { top: 88%; opacity: 0;   }
  52%  { top: 6%;  opacity: 0;   }
  54%  { top: 6%;  opacity: 0.9; }
  100% { top: 6%;  opacity: 0.9; }
`

const pulse = keyframes`
  0%, 100% { opacity: 0.35; transform: scale(0.85); }
  50%       { opacity: 1;    transform: scale(1);    }
`

function CornerBracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  return (
    <Box
      sx={{
        position: "absolute",
        width: 22,
        height: 22,
        borderColor: "primary.main",
        borderStyle: "solid",
        borderWidth: 0,
        ...(pos === "tl" && { top: -1, left: -1, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: "2px" }),
        ...(pos === "tr" && { top: -1, right: -1, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: "2px" }),
        ...(pos === "bl" && { bottom: -1, left: -1, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: "2px" }),
        ...(pos === "br" && { bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: "2px" }),
      }}
    />
  )
}

// html5-qrcode calls video.play() in setupSurface() and resume() with no
// .catch(). When the camera is stopped, any pending play() is aborted by the
// browser → unhandled AbortError. Patch the prototype once so every call
// already handles AbortErrors internally. Module-level flag prevents
// double-patching under React StrictMode's double-invoke.
let videoPlayPatched = false
function patchVideoPlay() {
  if (videoPlayPatched) return
  videoPlayPatched = true
  const orig = HTMLVideoElement.prototype.play
  HTMLVideoElement.prototype.play = function (this: HTMLVideoElement) {
    return orig.call(this).catch((e: unknown) => {
      if (e instanceof DOMException && e.name === "AbortError") return undefined
      return Promise.reject(e)
    })
  }
}

export function QrScanner({
  busy = false,
  onDecode,
}: {
  busy?: boolean
  onDecode: (decodedText: string) => void
}) {
  const containerId = "qr-reader"
  const onDecodeRef = useRef(onDecode)
  useEffect(() => { onDecodeRef.current = onDecode })

  useEffect(() => {
    patchVideoPlay()

    const scanner = new Html5Qrcode(containerId)
    let started = false
    let cancelled = false

    // clear() must run AFTER stop() resolves — the state machine stays SCANNING
    // until stop()'s .then() calls execute(), so calling clear() early throws
    // "Cannot clear while scan is ongoing, close it first."
    const stopScanner = () => {
      try {
        void scanner
          .stop()
          .catch(() => undefined)
          .finally(() => { try { scanner.clear() } catch { /* ignore */ } })
      } catch {
        // stop() threw synchronously — scanner never started
        try { scanner.clear() } catch { /* ignore */ }
      }
    }

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => onDecodeRef.current(decodedText),
        () => undefined,
      )
      .then(() => {
        started = true
        if (cancelled) stopScanner()
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
      if (started) stopScanner()
    }
  }, [])

  return (
    <Box
      sx={{
        borderRadius: 1,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {/* Camera output with library overrides */}
      <Box
        sx={{
          position: "relative",
          "& #qr-reader__dashboard": { display: "none !important" },
          "& #qr-reader__header_message": { display: "none !important" },
          "& #qr-reader > img": { display: "none !important" },
          "& video": { display: "block !important", width: "100% !important", height: "auto !important" },
          "& canvas": { width: "100% !important" },
        }}
      >
        <Box id={containerId} sx={{ width: "100%", minHeight: 240, bgcolor: "#000" }} />

        {/* Scan window frame overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Darkened border around scan area */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: `
                linear-gradient(to right, rgba(0,0,0,0.42) 0%, transparent 22%, transparent 78%, rgba(0,0,0,0.42) 100%),
                linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, transparent 22%, transparent 78%, rgba(0,0,0,0.42) 100%)
              `,
            }}
          />

          {/* Scan window with corner brackets */}
          <Box sx={{ position: "relative", width: 240, height: 240, zIndex: 1 }}>
            <CornerBracket pos="tl" />
            <CornerBracket pos="tr" />
            <CornerBracket pos="bl" />
            <CornerBracket pos="br" />

            {/* Animated scan line */}
            {!busy && (
              <Box
                sx={{
                  position: "absolute",
                  left: 6,
                  right: 6,
                  height: "2px",
                  background: (theme) =>
                    `linear-gradient(to right, transparent, ${theme.palette.primary.main}, transparent)`,
                  borderRadius: "2px",
                  animation: `${scanLine} 2.6s ease-in-out infinite`,
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Footer status bar */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        {busy ? (
          <Typography variant="caption" color="text.disabled" fontWeight={500}>
            Processing…
          </Typography>
        ) : (
          <>
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: "success.main",
                animation: `${pulse} 1.6s ease-in-out infinite`,
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              letterSpacing="0.07em"
            >
              SCANNING
            </Typography>
          </>
        )}
      </Box>
    </Box>
  )
}
