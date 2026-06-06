import { NextRequest } from "next/server"
import { runMarkAbsent } from "@/lib/cron/mark-absent"
import { jsonResponse } from "@/lib/route-helpers"

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!cronSecret || secret !== cronSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401)
  }

  const result = await runMarkAbsent()
  return jsonResponse({ data: result })
}
