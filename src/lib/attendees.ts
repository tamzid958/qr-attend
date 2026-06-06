import { parse } from "csv-parse/sync"
import { z } from "zod"
import ExcelJS from "exceljs"
import { generateToken, generateUniqueShortCode } from "@/lib/qr"
import { sendQrEmail } from "@/lib/email"
import { prisma } from "@/lib/prisma"
import { eventAttendeeSelect } from "@/lib/selectors"
import type {
  EventAttendeeRow,
  SendQrResponse,
  UploadPreviewResponse,
  UploadPreviewRow,
} from "@/types"

type RawUploadRow = { name: string; email: string; phone: string }
const requiredColumns = ["name", "email", "phone"] as const

function normalizeRow(value: Record<string, unknown>): RawUploadRow {
  return {
    name: String(value.name ?? "").trim(),
    email: String(value.email ?? "").trim().toLowerCase(),
    phone: String(value.phone ?? "").trim(),
  }
}

function isEmailValid(email: string): boolean {
  return z.string().email().safeParse(email).success
}

async function parseSpreadsheet(buffer: Buffer, extension: string): Promise<Record<string, unknown>[]> {
  if (extension === ".csv") {
    return parse(buffer, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, unknown>[]
  }
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer)
  const sheet = workbook.worksheets[0]
  if (!sheet) return []
  const headers: string[] = []
  const rows: Record<string, unknown>[] = []
  sheet.eachRow((row, rowIndex) => {
    if (rowIndex === 1) {
      row.eachCell((cell) => headers.push(String(cell.value ?? "")))
      return
    }
    const record: Record<string, unknown> = {}
    row.eachCell({ includeEmpty: true }, (cell, colIndex) => {
      record[headers[colIndex - 1] ?? ""] = cell.value ?? ""
    })
    rows.push(record)
  })
  return rows
}

export async function createUploadPreview(eventId: string, file: File): Promise<UploadPreviewResponse> {
  const extension = file.name.toLowerCase().endsWith(".xlsx") ? ".xlsx" : ".csv"
  const buffer = Buffer.from(await file.arrayBuffer())
  const records = await parseSpreadsheet(buffer, extension)
  const missingColumns = requiredColumns.filter((col) => !(col in (records[0] ?? {})))

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(", ")}`)
  }

  // Emails already registered for this specific event
  const existingInEvent = new Set(
    (
      await prisma.eventAttendee.findMany({
        where: { eventId },
        select: { attendee: { select: { email: true } } },
      })
    ).map((ea) => ea.attendee.email.toLowerCase()),
  )

  const seenEmails = new Set<string>()
  let validCount = 0
  let errorCount = 0
  let duplicateCount = 0

  const rows: UploadPreviewRow[] = records.map((record, index) => {
    const row = normalizeRow(record)
    let error: string | undefined
    let duplicate = false

    if (!row.name || !row.email || !row.phone) {
      error = "Name, email, and phone are required"
    } else if (!isEmailValid(row.email)) {
      error = "Invalid email format"
    }

    if (seenEmails.has(row.email) || existingInEvent.has(row.email)) {
      duplicate = true
    }

    seenEmails.add(row.email)

    if (error) errorCount += 1
    else if (duplicate) duplicateCount += 1
    else validCount += 1

    return { row: index + 2, ...row, error, duplicate }
  })

  return { rows, validCount, errorCount, duplicateCount }
}

export async function confirmUpload(eventId: string, file: File): Promise<UploadPreviewResponse> {
  const preview = await createUploadPreview(eventId, file)
  const validRows = preview.rows.filter((row) => !row.error && !row.duplicate)

  for (const row of validRows) {
    const attendee = await prisma.attendee.upsert({
      where: { email: row.email },
      update: { name: row.name, phone: row.phone },
      create: { name: row.name, email: row.email, phone: row.phone },
      select: { id: true },
    })

    await prisma.eventAttendee.upsert({
      where: { eventId_attendeeId: { eventId, attendeeId: attendee.id } },
      update: {},
      create: {
        eventId,
        attendeeId: attendee.id,
        uniqueToken: generateToken(),
        shortCode: await generateUniqueShortCode(prisma),
        status: "REGISTERED",
      },
    })
  }

  return preview
}

export async function sendQrEmails(
  eventId: string,
  eventAttendees: EventAttendeeRow[],
): Promise<SendQrResponse> {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } })
  const errors: { email: string; reason: string }[] = []
  let sent = 0

  for (const ea of eventAttendees) {
    try {
      await sendQrEmail(ea.attendee, event, ea.uniqueToken, ea.shortCode)
      await prisma.eventAttendee.update({
        where: { id: ea.id },
        data: { status: ea.status === "PRESENT" ? "PRESENT" : "INVITED" },
      })
      sent += 1
    } catch (error: unknown) {
      errors.push({
        email: ea.attendee.email,
        reason: error instanceof Error ? error.message : "Unknown email failure",
      })
    }
  }

  return { sent, failed: errors.length, errors }
}
