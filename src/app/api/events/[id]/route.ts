import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { eventSelect } from "@/lib/selectors"
import { handleRouteError, jsonResponse, requireRole, requireSession, RouteError } from "@/lib/route-helpers"
import { Role } from "@/types"

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  location: z.string().min(1).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  scannerIds: z.array(z.string()).optional(),
})

async function resolveEvent(id: string) {
  const event = await prisma.event.findUnique({ where: { id }, select: eventSelect })
  if (!event) throw new RouteError("EVENT_NOT_FOUND", 404)
  return event
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN])
    const { id } = await params
    return jsonResponse({ data: await resolveEvent(id) })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN])
    const { id } = await params
    const parsed = patchSchema.parse(await request.json())

    await prisma.event.update({
      where: { id },
      data: {
        ...(parsed.title !== undefined && { title: parsed.title }),
        ...(parsed.startDate !== undefined && { startDate: new Date(parsed.startDate) }),
        ...(parsed.endDate !== undefined && { endDate: new Date(parsed.endDate) }),
        ...(parsed.location !== undefined && { location: parsed.location }),
        ...(parsed.status !== undefined && { status: parsed.status }),
      },
    })

    if (parsed.scannerIds !== undefined) {
      await prisma.eventScanner.deleteMany({ where: { eventId: id } })
      if (parsed.scannerIds.length > 0) {
        await prisma.eventScanner.createMany({
          data: parsed.scannerIds.map((userId) => ({ eventId: id, userId })),
          skipDuplicates: true,
        })
      }
    }

    const result = await prisma.event.findUnique({ where: { id }, select: eventSelect })
    return jsonResponse({ data: result })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN])
    const { id } = await params
    await prisma.event.delete({ where: { id } })
    return jsonResponse({ data: null })
  } catch (error) {
    return handleRouteError(error)
  }
}
