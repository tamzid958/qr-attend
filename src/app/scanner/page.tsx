import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { AppLayout } from "@/components/layout/AppLayout"
import { ScannerPageClient } from "@/components/scanner/ScannerPageClient"
import type { AssignedEvent } from "@/types"

export default async function ScannerPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const eventScanners = await prisma.eventScanner.findMany({
    where: { userId: session.user.id, event: { status: "active" } },
    select: {
      event: {
        select: { id: true, title: true, location: true, status: true, startDate: true, endDate: true },
      },
    },
  })

  const assignedEvents: AssignedEvent[] = eventScanners.map((es) => ({
    id: es.event.id,
    title: es.event.title,
    location: es.event.location,
    status: es.event.status,
    startDate: es.event.startDate.toISOString(),
    endDate: es.event.endDate.toISOString(),
  }))

  return (
    <AppLayout user={session.user}>
      <ScannerPageClient assignedEvents={assignedEvents} />
    </AppLayout>
  )
}
