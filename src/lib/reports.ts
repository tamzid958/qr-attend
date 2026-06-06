import PDFDocument from "pdfkit"
import ExcelJS from "exceljs"
import { stringify } from "csv-stringify/sync"
import { prisma } from "@/lib/prisma"
import type { AttendeeStatus } from "@/types"

export type ReportFilters = {
  eventId: string
  from?: Date
  to?: Date
  status?: AttendeeStatus
}

type ReportRow = {
  id: string
  attendeeName: string
  attendeeEmail: string
  phone: string
  gateName: string | null
  scannedAt: Date | null
  status: AttendeeStatus
}

export async function getReportRecords(filters: ReportFilters): Promise<ReportRow[]> {
  const rows = await prisma.eventAttendee.findMany({
    where: {
      eventId: filters.eventId,
      status: filters.status,
    },
    include: {
      attendee: { select: { name: true, email: true, phone: true } },
      attendanceLogs: {
        where: filters.from || filters.to
          ? { scannedAt: { gte: filters.from, lte: filters.to } }
          : undefined,
        orderBy: { scannedAt: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return rows.map((ea) => ({
    id: ea.id,
    attendeeName: ea.attendee.name,
    attendeeEmail: ea.attendee.email,
    phone: ea.attendee.phone,
    gateName: ea.attendanceLogs[0]?.gateName ?? null,
    scannedAt: ea.attendanceLogs[0]?.scannedAt ?? null,
    status: ea.status as AttendeeStatus,
  }))
}

export async function exportReport(
  format: "csv" | "excel" | "pdf",
  filters: ReportFilters,
): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
  const records = await getReportRecords(filters)
  const rows = records.map((row) => ({
    Name: row.attendeeName,
    Email: row.attendeeEmail,
    Phone: row.phone,
    Status: row.status,
    Gate: row.gateName ?? "",
    "Check-in Time": row.scannedAt ? row.scannedAt.toISOString() : "",
  }))

  if (format === "csv") {
    return {
      buffer: Buffer.from(stringify(rows, { header: true })),
      contentType: "text/csv",
      fileName: "report.csv",
    }
  }

  if (format === "excel") {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("Report")
    if (rows.length > 0) {
      sheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key }))
      rows.forEach((row) => sheet.addRow(row))
    }
    return {
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileName: "report.xlsx",
    }
  }

  const document = new PDFDocument({ margin: 36 })
  const chunks: Buffer[] = []
  const buffer = await new Promise<Buffer>((resolve, reject) => {
    document.on("data", (chunk: Buffer) => chunks.push(chunk))
    document.on("end", () => resolve(Buffer.concat(chunks)))
    document.on("error", reject)
    document.fontSize(20).text("Attendance Report", { align: "center" })
    document.moveDown()
    rows.forEach((row) => {
      document.fontSize(11).text(
        `${row.Name} | ${row.Email} | ${row.Phone} | ${row.Gate} | ${row["Check-in Time"]} | ${row.Status}`,
      )
      document.moveDown(0.4)
    })
    document.end()
  })

  return { buffer, contentType: "application/pdf", fileName: "report.pdf" }
}
