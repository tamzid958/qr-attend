import nodemailer from "nodemailer"
import type { Event } from "../../generated/client"
import type { AttendeeIdentity } from "@/types"

const smtpPort = Number(process.env.SMTP_PORT ?? "587")
const smtpMode = process.env.SMTP_MODE ?? "smtp"

const consoleTransport = nodemailer.createTransport({
  streamTransport: true,
  buffer: true,
  newline: "unix",
})

const smtpUser = process.env.SMTP_USER || undefined
const smtpPass = process.env.SMTP_PASS || undefined
const smtpAuth = smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined

export const transporter =
  smtpMode === "console"
    ? consoleTransport
    : nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: smtpAuth,
      })

export function getAuthMailServer() {
  if (smtpMode === "console") {
    return {
      streamTransport: true,
      buffer: true,
      newline: "unix" as const,
    }
  }

  return {
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: smtpAuth,
  }
}

function logConsoleEmail(label: string, to: string, subject: string, info: unknown): void {
  const message =
    info !== null && typeof info === "object" && "message" in info && Buffer.isBuffer((info as { message: unknown }).message)
      ? ((info as { message: Buffer }).message).toString("utf8")
      : `Console email generated for ${to}`

  console.info([
    "",
    `=== ${label} ===`,
    `To: ${to}`,
    `Subject: ${subject}`,
    message,
    `=== END ${label} ===`,
    "",
  ].join("\n"))
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function emailWrapper(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e4e4e7;">
          ${body}
        </table>

        <!-- Footer -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;padding:24px 0 0;">
          <tr>
            <td style="font-size:12px;color:#71717a;text-align:center;line-height:1.6;">
              © QR Attend &nbsp;·&nbsp; Event Operations Platform<br />
              Questions? Reply to this email or contact <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color:#71717a;">${process.env.SUPPORT_EMAIL}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendMagicLinkEmail(params: {
  email: string
  url: string
  host: string
}): Promise<void> {
  const body = `
    <!-- Header -->
    <tr>
      <td style="background:#0a0a0a;padding:28px 40px;">
        <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;">QR Attend</p>
        <p style="margin:4px 0 0;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.35);">Event Operations</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:40px 40px 32px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#09090b;">Sign in to ${params.host}</h1>
        <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#52525b;">
          Click the button below to complete your passwordless sign-in. This link expires in 24 hours and can only be used once.
        </p>

        <!-- CTA Button -->
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="background:#0a0a0a;">
              <a href="${params.url}"
                 style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;letter-spacing:0.01em;color:#ffffff;text-decoration:none;">
                Sign In &rarr;
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:32px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="margin:8px 0 0;font-size:12px;line-height:1.5;word-break:break-all;color:#2563eb;">${params.url}</p>
      </td>
    </tr>

    <!-- Divider -->
    <tr>
      <td style="padding:0 40px;">
        <hr style="border:none;border-top:1px solid #e4e4e7;margin:0;" />
      </td>
    </tr>

    <!-- Security note -->
    <tr>
      <td style="padding:20px 40px 32px;">
        <p style="margin:0;font-size:12px;color:#71717a;line-height:1.6;">
          If you did not request this sign-in link, you can safely ignore this email. Someone may have entered your email address by mistake.
        </p>
      </td>
    </tr>
  `

  const html = emailWrapper(body)

  const info = await transporter.sendMail({
    from: process.env.SUPPORT_EMAIL,
    to: params.email,
    subject: `Sign in to ${params.host}`,
    text: `Sign in to ${params.host}\n\n${params.url}\n\nIf you did not request this email, you can safely ignore it.`,
    html,
  })

  if (smtpMode === "console") {
    logConsoleEmail("MAGIC LINK EMAIL PREVIEW", params.email, `Sign in to ${params.host}`, info)
  }
}

export async function sendWelcomeEmail(user: { name: string; email: string; role: string }): Promise<void> {
  const baseUrl = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "")
  const loginUrl = `${baseUrl}/login`
  const roleLabel = user.role === "ADMIN" ? "Administrator" : "Scanner"

  const body = `
    <!-- Header -->
    <tr>
      <td style="background:#0a0a0a;padding:28px 40px;">
        <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;">QR Attend</p>
        <p style="margin:4px 0 0;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.35);">Event Operations</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:40px 40px 32px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#09090b;">You've been added to QR Attend</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#52525b;">
          Hi <strong>${escapeHtml(user.name)}</strong>, an admin has created an account for you as <strong>${escapeHtml(roleLabel)}</strong>.
          Sign in with your email — no password needed.
        </p>

        <!-- CTA Button -->
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="background:#0a0a0a;">
              <a href="${loginUrl}"
                 style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;letter-spacing:0.01em;color:#ffffff;text-decoration:none;">
                Sign In &rarr;
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:32px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
          Go to <a href="${loginUrl}" style="color:#2563eb;">${loginUrl}</a>, enter your email address, and we'll send you a sign-in link.
        </p>
      </td>
    </tr>

    <!-- Divider -->
    <tr>
      <td style="padding:0 40px;">
        <hr style="border:none;border-top:1px solid #e4e4e7;margin:0;" />
      </td>
    </tr>

    <tr>
      <td style="padding:20px 40px 32px;">
        <p style="margin:0;font-size:12px;color:#71717a;line-height:1.6;">
          If you did not expect this email, you can safely ignore it.
        </p>
      </td>
    </tr>
  `

  const html = emailWrapper(body)

  const info = await transporter.sendMail({
    from: process.env.SUPPORT_EMAIL,
    to: user.email,
    subject: "You've been added to QR Attend",
    text: `Hi ${user.name},\n\nAn admin has created an account for you as ${roleLabel}.\n\nSign in at: ${loginUrl}\n\nEnter your email and we'll send you a magic link — no password needed.`,
    html,
  })

  if (smtpMode === "console") {
    logConsoleEmail("WELCOME EMAIL PREVIEW", user.email, "You've been added to QR Attend", info)
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date)
}

function formatDateRange(event: Event): string {
  const startDate = formatDate(event.startDate)
  const endDate = formatDate(event.endDate)
  const startTime = formatTime(event.startDate)
  const endTime = formatTime(event.endDate)

  if (startDate === endDate) {
    return `${startDate} · ${startTime} – ${endTime}`
  }
  return `${startDate}, ${startTime} – ${endDate}, ${endTime}`
}

export async function sendQrEmail(
  attendee: AttendeeIdentity,
  event: Event,
  uniqueToken: string,
  shortCode: string,
): Promise<void> {
  const baseUrl = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "")
  const qrImageUrl = `${baseUrl}/api/qr/${uniqueToken}`
  const dateRange = formatDateRange(event)

  const body = `
    <!-- Header -->
    <tr>
      <td style="background:#0a0a0a;padding:28px 40px;">
        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.45);">You're registered for</p>
        <h1 style="margin:6px 0 0;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">${escapeHtml(event.title)}</h1>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;">${dateRange.replace(" – ", "<br/>– ")}</p>
      </td>
    </tr>

    <!-- Greeting -->
    <tr>
      <td style="padding:36px 40px 24px;">
        <p style="margin:0;font-size:16px;line-height:1.7;color:#09090b;">
          Hi <strong>${escapeHtml(attendee.name)}</strong>,
        </p>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:#52525b;">
          Your entry QR code is ready. Show this at the door to check in — no printing needed, your phone screen works fine.
        </p>
      </td>
    </tr>

    <!-- QR Code -->
    <tr>
      <td style="padding:0 40px 36px;" align="center">
        <table cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e4e4e7;background:#ffffff;">
          <tr>
            <td style="padding:20px;">
              <img src="${qrImageUrl}"
                   width="220"
                   height="220"
                   alt="Entry QR Code"
                   style="display:block;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:12px 20px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#71717a;">Entry QR Code</p>
              <p style="margin:4px 0 0;font-size:11px;color:#a1a1aa;">${escapeHtml(attendee.name)}</p>
              <p style="margin:8px 0 0;font-size:18px;font-weight:800;letter-spacing:0.18em;color:#09090b;font-family:monospace;">${escapeHtml(shortCode)}</p>
              <p style="margin:2px 0 0;font-size:10px;color:#a1a1aa;">Short code — use if QR scan fails</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Instructions -->
    <tr>
      <td style="padding:0 40px;">
        <hr style="border:none;border-top:1px solid #e4e4e7;margin:0;" />
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 32px;">
        <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
          <tr>
            <td style="padding:0 16px 0 0;width:33%;vertical-align:top;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#09090b;">Event</p>
              <p style="margin:4px 0 0;font-size:13px;color:#52525b;line-height:1.5;">${escapeHtml(event.title)}</p>
            </td>
            <td style="padding:0 16px;width:33%;vertical-align:top;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#09090b;">Date &amp; Time</p>
              <p style="margin:4px 0 0;font-size:13px;color:#52525b;line-height:1.5;">${escapeHtml(dateRange)}</p>
            </td>
            <td style="padding:0 0 0 16px;width:33%;vertical-align:top;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#09090b;">Attendee</p>
              <p style="margin:4px 0 0;font-size:13px;color:#52525b;line-height:1.5;">${escapeHtml(attendee.name)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Warning -->
    <tr>
      <td style="padding:0 40px 32px;">
        <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background:#fafafa;border-left:3px solid #0a0a0a;">
          <tr>
            <td style="padding:12px 16px;">
              <p style="margin:0;font-size:13px;color:#52525b;line-height:1.6;">
                <strong>Do not share this QR code.</strong> It is unique to you and can only be used once for entry.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `

  const html = emailWrapper(body)

  const info = await transporter.sendMail({
    from: process.env.SUPPORT_EMAIL,
    to: attendee.email,
    subject: `Your entry QR code — ${event.title}`,
    text: `Hi ${attendee.name},\n\nYour QR code for ${event.title} (${dateRange}) is attached.\n\nShort code (use if QR scan fails): ${shortCode}\n\nPresent it at the entrance. Do not share it.\n\nNeed help? Contact ${process.env.SUPPORT_EMAIL}`,
    html,
  })

  if (smtpMode === "console") {
    logConsoleEmail("QR EMAIL PREVIEW", attendee.email, `Your entry QR code — ${event.title}`, info)
  }
}
