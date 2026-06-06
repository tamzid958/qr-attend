import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { UsersPageClient } from "@/components/users/UsersPageClient"
import { AppLayout } from "@/components/layout/AppLayout"
import { Role } from "@/types"

export default async function UsersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== Role.ADMIN) redirect("/scanner")

  return (
    <AppLayout user={session.user}>
      <UsersPageClient />
    </AppLayout>
  )
}
