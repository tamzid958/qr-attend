import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { DashboardPanel } from "@/components/dashboard/DashboardPanel"
import { AppLayout } from "@/components/layout/AppLayout"
import { getDashboardStats } from "@/lib/dashboard"
import { Role } from "@/types"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== Role.ADMIN) redirect("/scanner")

  const data = await getDashboardStats()

  return (
    <AppLayout user={session.user}>
      <DashboardPanel initialData={data} />
    </AppLayout>
  )
}
