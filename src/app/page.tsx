import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Role } from "@/types"

export default async function HomePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  redirect(session.user.role === Role.ADMIN ? "/dashboard" : "/scanner")
}
