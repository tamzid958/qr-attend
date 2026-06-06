import { auth } from "@/auth"
import { handleRouteError, jsonResponse, requireRole, requireSession } from "@/lib/route-helpers"
import { prisma } from "@/lib/prisma"
import { Role } from "@/types"

export async function GET() {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN, Role.SCANNER])

    const data = await prisma.attendanceLog.findMany({
      where: { scannedBy: session.user.id },
      include: {
        eventAttendee: {
          include: {
            attendee: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { scannedAt: "desc" },
      take: 50,
    })

    return jsonResponse({ data })
  } catch (error: unknown) {
    return handleRouteError(error)
  }
}
