import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { attendeeIdentitySelect } from "@/lib/selectors"
import { RouteError, handleRouteError, jsonResponse, requireRole, requireSession } from "@/lib/route-helpers"
import { Role } from "@/types"

const bodySchema = z.object({
  token: z.string().min(1).optional(),
  shortCode: z.string().min(1).optional(),
  gateName: z.string().min(1),
}).refine((d) => d.token ?? d.shortCode, { message: "token or shortCode is required" })

export async function POST(request: Request) {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN, Role.SCANNER])
    const parsed = bodySchema.parse(await request.json())

    const where = parsed.token
      ? { uniqueToken: parsed.token }
      : { shortCode: parsed.shortCode!.toUpperCase() }

    const eventAttendee = await prisma.eventAttendee.findUnique({
      where,
      include: {
        attendee: { select: attendeeIdentitySelect },
        attendanceLogs: { orderBy: { scannedAt: "asc" }, take: 1 },
      },
    })

    if (!eventAttendee) {
      return jsonResponse({ error: "INVALID_TOKEN" }, 404)
    }

    if (eventAttendee.status === "PRESENT") {
      return jsonResponse({
        data: {
          status: "DUPLICATE",
          attendee: { ...eventAttendee.attendee, status: eventAttendee.status },
          firstCheckinAt: eventAttendee.attendanceLogs[0]?.scannedAt.toISOString(),
        },
      })
    }

    const [updated, log] = await prisma.$transaction([
      prisma.eventAttendee.update({
        where: { id: eventAttendee.id },
        data: { status: "PRESENT" },
        include: { attendee: { select: attendeeIdentitySelect } },
      }),
      prisma.attendanceLog.create({
        data: {
          eventAttendeeId: eventAttendee.id,
          scannedBy: session.user.id,
          gateName: parsed.gateName,
        },
      }),
    ])

    return jsonResponse({
      data: {
        status: "SUCCESS",
        attendee: { ...updated.attendee, status: updated.status },
        checkedInAt: log.scannedAt.toISOString(),
      },
    })
  } catch (error: unknown) {
    return handleRouteError(error)
  }
}
