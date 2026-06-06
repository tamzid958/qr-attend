import QRCode from "qrcode"
import type { PrismaClient } from "../../generated/client"

export function generateToken(): string {
  return crypto.randomUUID()
}

const SHORT_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function randomShortCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => SHORT_CODE_CHARS[b % SHORT_CODE_CHARS.length])
    .join("")
}

export async function generateUniqueShortCode(prisma: PrismaClient): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomShortCode()
    const existing = await prisma.eventAttendee.findUnique({
      where: { shortCode: code },
      select: { id: true },
    })
    if (!existing) return code
  }
  throw new Error("Failed to generate a unique short code after 10 attempts")
}

export async function generateQrBase64(token: string): Promise<string> {
  return QRCode.toDataURL(`attendance://${token}`, {
    errorCorrectionLevel: "H",
  })
}
