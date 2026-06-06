import { z } from "zod"
import { auth } from "@/auth"
import { exportReport } from "@/lib/reports"
import { handleRouteError, requireRole, requireSession } from "@/lib/route-helpers"
import { AttendeeStatus, Role } from "@/types"
import { NextResponse } from "next/server"

const querySchema = z.object({
  format: z.enum(["csv", "excel", "pdf"]),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  status: z.enum([AttendeeStatus.REGISTERED, AttendeeStatus.INVITED, AttendeeStatus.PRESENT, AttendeeStatus.ABSENT]).optional(),
})

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN])
    const { id: eventId } = await params
    const parsed = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams))

    const { buffer, contentType, fileName } = await exportReport(parsed.format, {
      eventId,
      from: parsed.from ? new Date(parsed.from) : undefined,
      to: parsed.to ? new Date(parsed.to) : undefined,
      status: parsed.status,
    })

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
