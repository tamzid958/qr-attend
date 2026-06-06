import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { eventSelect } from "@/lib/selectors"
import { handleRouteError, jsonResponse, requireRole, requireSession, totalPages } from "@/lib/route-helpers"
import { Role } from "@/types"

const querySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const createSchema = z.object({
  title: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  location: z.string().min(1),
  status: z.enum(["active", "inactive"]).default("active"),
  scannerIds: z.array(z.string()).optional(),
})

export async function GET(request: Request) {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN])
    const parsed = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams))

    const where = parsed.search
      ? { title: { contains: parsed.search, mode: "insensitive" as const } }
      : {}

    const [data, total] = await Promise.all([
      prisma.event.findMany({
        where,
        select: eventSelect,
        orderBy: { startDate: "desc" },
        skip: (parsed.page - 1) * parsed.limit,
        take: parsed.limit,
      }),
      prisma.event.count({ where }),
    ])

    return jsonResponse({ data: { data, total, page: parsed.page, totalPages: totalPages(total, parsed.limit) } })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN])
    const parsed = createSchema.parse(await request.json())

    const event = await prisma.event.create({
      data: {
        title: parsed.title,
        startDate: new Date(parsed.startDate),
        endDate: new Date(parsed.endDate),
        location: parsed.location,
        status: parsed.status,
      },
      select: eventSelect,
    })

    if (parsed.scannerIds && parsed.scannerIds.length > 0) {
      await prisma.eventScanner.createMany({
        data: parsed.scannerIds.map((userId) => ({ eventId: event.id, userId })),
        skipDuplicates: true,
      })
      const created = await prisma.event.findUnique({ where: { id: event.id }, select: eventSelect })
      return jsonResponse({ data: created }, 201)
    }

    return jsonResponse({ data: event }, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
