import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { userSelect } from "@/lib/selectors"
import { handleRouteError, jsonResponse, requireRole, requireSession, RouteError } from "@/lib/route-helpers"
import { Role } from "@/types"

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.nativeEnum(Role).optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN])
    const { id } = await params
    const parsed = patchSchema.parse(await request.json())

    const updated = await prisma.user.update({
      where: { id },
      data: parsed,
      select: userSelect,
    })

    return jsonResponse({ data: updated })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN])
    const { id } = await params

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) throw new RouteError("USER_NOT_FOUND", 404)
    if (user.id === session.user.id) return jsonResponse({ error: "Cannot delete yourself" }, 400)

    await prisma.user.delete({ where: { id } })
    return jsonResponse({ data: null })
  } catch (error) {
    return handleRouteError(error)
  }
}
