import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { eventAttendeeSelect } from "@/lib/selectors"
import { handleRouteError, jsonResponse, requireRole, requireSession } from "@/lib/route-helpers"
import { Role } from "@/types"

const updateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; attendeeId: string }> },
) {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN])
    const { id: eventId, attendeeId } = await params
    const body = updateSchema.parse(await request.json())

    const eventAttendee = await prisma.eventAttendee.findUnique({
      where: { id: attendeeId, eventId },
      select: { attendeeId: true },
    })
    if (!eventAttendee) {
      return jsonResponse({ error: "Attendee not found" }, 404)
    }

    // If email changed, check for conflicts in this event
    if (body.email) {
      const conflict = await prisma.eventAttendee.findFirst({
        where: {
          eventId,
          attendee: { email: body.email },
          NOT: { id: attendeeId },
        },
      })
      if (conflict) {
        return jsonResponse({ error: "Another attendee with this email is already registered for this event" }, 409)
      }
    }

    await prisma.attendee.update({
      where: { id: eventAttendee.attendeeId },
      data: { name: body.name, email: body.email, phone: body.phone },
    })

    const updated = await prisma.eventAttendee.findUnique({
      where: { id: attendeeId },
      select: eventAttendeeSelect,
    })

    return jsonResponse({ data: updated })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; attendeeId: string }> },
) {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN])
    const { id: eventId, attendeeId } = await params

    const existing = await prisma.eventAttendee.findUnique({
      where: { id: attendeeId, eventId },
    })
    if (!existing) {
      return jsonResponse({ error: "Attendee not found" }, 404)
    }

    await prisma.eventAttendee.delete({ where: { id: attendeeId } })

    return jsonResponse({ data: null })
  } catch (error) {
    return handleRouteError(error)
  }
}
