import { z } from "zod"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendWelcomeEmail } from "@/lib/email"
import { handleRouteError } from "@/lib/route-helpers"
import { Role } from "@/types"

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

async function hasUsers(): Promise<boolean> {
  return (await prisma.user.count()) > 0
}

export async function GET() {
  try {
    return NextResponse.json({ needed: !(await hasUsers()) })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    if (await hasUsers()) {
      return NextResponse.json({ error: "Setup already complete" }, { status: 409 })
    }

    const body = createSchema.parse(await request.json())

    await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        role: Role.ADMIN,
        passwordHash: "",
      },
    })

    void sendWelcomeEmail({ name: body.name, email: body.email, role: Role.ADMIN })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
