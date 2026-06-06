import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { EventAttendeesPageClient } from "@/components/attendees/EventAttendeesPageClient"
import { AppLayout } from "@/components/layout/AppLayout"
import { Role } from "@/types"

export default async function EventAttendeesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== Role.ADMIN) redirect("/scanner")

  const { id } = await params
  const event = await prisma.event.findUnique({ where: { id }, select: { id: true, title: true } })
  if (!event) redirect("/events")

  return (
    <AppLayout breadcrumb={[{ label: "Events", href: "/events" }, { label: event.title }]} user={session.user}>
      <EventAttendeesPageClient eventId={id} />
    </AppLayout>
  )
}
