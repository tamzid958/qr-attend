import { auth } from "@/auth"
import { createUploadPreview, confirmUpload } from "@/lib/attendees"
import { handleRouteError, jsonResponse, requireRole, requireSession } from "@/lib/route-helpers"
import { Role } from "@/types"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = requireSession(await auth())
    requireRole(session, [Role.ADMIN])
    const { id: eventId } = await params
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return jsonResponse({ error: "No file provided" }, 400)

    const url = new URL(request.url)
    const confirm = url.searchParams.get("confirm") === "true"
    const result = confirm
      ? await confirmUpload(eventId, file)
      : await createUploadPreview(eventId, file)

    return jsonResponse({ data: result })
  } catch (error) {
    return handleRouteError(error)
  }
}
