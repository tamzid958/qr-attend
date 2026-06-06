import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import { Role } from "@/types"

const adminPaths = ["/dashboard", "/events", "/users"]
const scannerPaths = ["/scanner"]

async function isSetupNeeded(request: NextRequest): Promise<boolean> {
  try {
    const res = await fetch(new URL("/api/setup", request.url))
    const json = (await res.json()) as { needed?: boolean }
    return json.needed === true
  } catch {
    return false
  }
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Already on the setup page — let it through
  if (pathname === "/setup") return NextResponse.next()

  // For login and root, check if setup is still needed
  if (pathname === "/" || pathname === "/login") {
    if (await isSetupNeeded(request)) {
      return NextResponse.redirect(new URL("/setup", request.url))
    }
    return NextResponse.next()
  }

  let token: Awaited<ReturnType<typeof getToken>> | null = null
  try {
    token = await getToken({ req: request, secret: process.env.AUTH_SECRET })
  } catch {
    token = null
  }

  const isProtected = [...adminPaths, ...scannerPaths].some((path) =>
    pathname.startsWith(path),
  )

  if (!isProtected) return NextResponse.next()

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const role = token.role as Role | undefined
  const adminOnly = adminPaths.some((path) => pathname.startsWith(path))
  const scannerAllowed = scannerPaths.some((path) => pathname.startsWith(path))

  if (adminOnly && role !== Role.ADMIN) {
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  if (scannerAllowed && (!role || ![Role.ADMIN, Role.SCANNER].includes(role))) {
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/setup",
    "/dashboard/:path*",
    "/events/:path*",
    "/users/:path*",
    "/scanner/:path*",
  ],
}
