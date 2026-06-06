import { Role } from "@/types"
import type { Session } from "next-auth"
import { NextResponse } from "next/server"
import type { ApiResponse } from "@/types"

export function jsonResponse<T>(body: ApiResponse<T>, status = 200): NextResponse {
  return NextResponse.json(body, { status })
}

export function requireSession(session: Session | null): Session {
  if (!session?.user) {
    throw new RouteError("UNAUTHORIZED", 401)
  }
  return session
}

export function requireRole(session: Session, roles: Role[]): void {
  if (!roles.includes(session.user.role)) {
    throw new RouteError("FORBIDDEN", 403)
  }
}

export class RouteError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function totalPages(total: number, limit: number): number {
  return Math.max(1, Math.ceil(total / limit))
}

export function handleRouteError<T>(error: unknown): NextResponse {
  if (error instanceof RouteError) {
    return jsonResponse<T>({ error: error.message }, error.status)
  }
  const message = error instanceof Error ? error.message : "Internal server error"
  return jsonResponse<T>({ error: message }, 500)
}
