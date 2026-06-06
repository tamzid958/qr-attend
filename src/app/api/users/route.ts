import { z } from "zod"
import { auth } from "@/auth"
import { sendWelcomeEmail } from "@/lib/email"
import { prisma } from "@/lib/prisma"
import { userSelect } from "@/lib/selectors"
import { handleRouteError, jsonResponse, requireRole, requireSession } from "@/lib/route-helpers"
import { Role } from "@/types"

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.nativeEnum(Role),
})

export async function GET(_req: Request) {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN])

    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" },
    })

    return jsonResponse({ data: users })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN])
    const parsed = createSchema.parse(await request.json())

    const existing = await prisma.user.findUnique({ where: { email: parsed.email } })
    if (existing) return jsonResponse({ error: "Email already in use" }, 409)

    const user = await prisma.user.create({
      data: { name: parsed.name, email: parsed.email, role: parsed.role, passwordHash: "" },
      select: userSelect,
    })

    void sendWelcomeEmail({ name: user.name, email: user.email, role: user.role })

    return jsonResponse({ data: user }, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
