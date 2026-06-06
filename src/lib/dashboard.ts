import { prisma } from "@/lib/prisma"
import type { DashboardStats, PerEventStat } from "@/types"

export async function getDashboardStats(): Promise<DashboardStats> {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [totalRegistered, totalPresent, hourlyRows, events] = await Promise.all([
    prisma.eventAttendee.count(),
    prisma.eventAttendee.count({ where: { status: "PRESENT" } }),
    prisma.$queryRaw<Array<{ hour: Date; count: bigint }>>`
      SELECT date_trunc('hour', "scannedAt") AS hour, COUNT(*)::bigint AS count
      FROM "AttendanceLog"
      WHERE "scannedAt" >= ${startOfToday} AND "scannedAt" <= NOW()
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    prisma.event.findMany({
      select: {
        id: true,
        title: true,
        _count: { select: { eventAttendees: true } },
        eventAttendees: { select: { status: true } },
      },
      orderBy: { startDate: "desc" },
      take: 10,
    }),
  ])

  const totalAbsent = totalRegistered - totalPresent

  const perEvent: PerEventStat[] = events.map((event) => {
    const registered = event._count.eventAttendees
    const present = event.eventAttendees.filter((ea) => ea.status === "PRESENT").length
    return {
      id: event.id,
      title: event.title,
      registered,
      present,
      percentage: registered === 0 ? 0 : Math.round((present / registered) * 1000) / 10,
    }
  })

  return {
    totalRegistered,
    totalPresent,
    totalAbsent,
    attendancePercentage:
      totalRegistered === 0 ? 0 : Math.round((totalPresent / totalRegistered) * 1000) / 10,
    hourlyCheckins: hourlyRows.map((row) => ({
      hour: `${String(row.hour.getHours()).padStart(2, "0")}:00`,
      count: Number(row.count),
    })),
    perEvent,
  }
}
