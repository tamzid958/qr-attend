import { prisma } from "@/lib/prisma"

export async function runMarkAbsent(): Promise<{ marked: number; events: number }> {
  const now = new Date()

  // Find active events that have ended
  const endedEvents = await prisma.event.findMany({
    where: { status: "active", endDate: { lt: now } },
    select: { id: true },
  })

  if (endedEvents.length === 0) return { marked: 0, events: 0 }

  const eventIds = endedEvents.map((e) => e.id)

  const result = await prisma.eventAttendee.updateMany({
    where: {
      eventId: { in: eventIds },
      status: { in: ["REGISTERED", "INVITED"] },
    },
    data: { status: "ABSENT" },
  })

  await prisma.event.updateMany({
    where: { id: { in: eventIds } },
    data: { status: "inactive" },
  })

  return { marked: result.count, events: endedEvents.length }
}
