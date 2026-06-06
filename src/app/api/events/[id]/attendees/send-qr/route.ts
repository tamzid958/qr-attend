import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { eventAttendeeSelect } from "@/lib/selectors"
import { sendQrEmails } from "@/lib/attendees"
import { handleRouteError, jsonResponse, requireRole, requireSession } from "@/lib/route-helpers"
import { Role } from "@/types"
import type { EventAttendeeRow } from "@/types"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN])
    const { id: eventId } = await params

    const { ids }: { ids?: string[] } = await req.json().catch(() => ({}))

    const eventAttendees = await prisma.eventAttendee.findMany({
      where: {
        eventId,
        status: { not: "PRESENT" },
        ...(ids && ids.length > 0 ? { id: { in: ids } } : {}),
      },
      select: eventAttendeeSelect,
    })

    const result = await sendQrEmails(eventId, eventAttendees as EventAttendeeRow[])
    return jsonResponse({ data: result })
  } catch (error) {
    return handleRouteError(error)
  }
}
