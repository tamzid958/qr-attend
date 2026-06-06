import { auth } from "@/auth"
import { getDashboardStats } from "@/lib/dashboard"
import {
  handleRouteError,
  jsonResponse,
  requireRole,
  requireSession,
} from "@/lib/route-helpers"
import { Role } from "@/types"

export async function GET() {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN])
    const data = await getDashboardStats()
    return jsonResponse({ data })
  } catch (error: unknown) {
    return handleRouteError(error)
  }
}
