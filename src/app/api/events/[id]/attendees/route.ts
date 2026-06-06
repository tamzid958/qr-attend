import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateToken, generateUniqueShortCode } from "@/lib/qr"
import { eventAttendeeSelect } from "@/lib/selectors"
import { handleRouteError, jsonResponse, requireRole, requireSession, totalPages } from "@/lib/route-helpers"
import { AttendeeStatus, Role } from "@/types"

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
})

const querySchema = z.object({
  search: z.string().optional(),
  status: z.enum([AttendeeStatus.REGISTERED, AttendeeStatus.INVITED, AttendeeStatus.PRESENT, AttendeeStatus.ABSENT]).optional(),
  all: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(20),
})

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN])
    const { id: eventId } = await params
    const parsed = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams))

    const where = {
      eventId,
      status: parsed.status,
      attendee: parsed.search
        ? {
            OR: [
              { name: { contains: parsed.search, mode: "insensitive" as const } },
              { email: { contains: parsed.search, mode: "insensitive" as const } },
              { phone: { contains: parsed.search, mode: "insensitive" as const } },
            ],
          }
        : undefined,
    }

    const [data, total] = await Promise.all([
      prisma.eventAttendee.findMany({
        where,
        select: eventAttendeeSelect,
        orderBy: { createdAt: "desc" },
        ...(parsed.all ? {} : { skip: (parsed.page - 1) * parsed.limit, take: parsed.limit }),
      }),
      prisma.eventAttendee.count({ where }),
    ])

    return jsonResponse({ data: { data, total, page: parsed.page, totalPages: totalPages(total, parsed.limit) } })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN])
    const { id: eventId } = await params
    const body = createSchema.parse(await request.json())

    const existing = await prisma.eventAttendee.findFirst({
      where: { eventId, attendee: { email: body.email } },
    })
    if (existing) {
      return jsonResponse({ error: "Attendee with this email is already registered for this event" }, 409)
    }

    const attendee = await prisma.attendee.upsert({
      where: { email: body.email },
      update: { name: body.name, phone: body.phone },
      create: { name: body.name, email: body.email, phone: body.phone },
      select: { id: true },
    })

    const eventAttendee = await prisma.eventAttendee.create({
      data: { eventId, attendeeId: attendee.id, uniqueToken: generateToken(), shortCode: await generateUniqueShortCode(prisma), status: "REGISTERED" },
      select: eventAttendeeSelect,
    })

    return jsonResponse({ data: eventAttendee }, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
