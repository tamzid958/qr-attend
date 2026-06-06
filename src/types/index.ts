import type { Attendee, User } from "../../generated/client"
import type { DefaultSession } from "next-auth"
import type { JWT as NextAuthJWT } from "next-auth/jwt"

export enum Role {
  ADMIN = "ADMIN",
  SCANNER = "SCANNER",
}

export enum AttendeeStatus {
  REGISTERED = "REGISTERED",
  INVITED = "INVITED",
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
}

export type SessionUser = {
  id: string
  name: string
  email: string
  role: Role
}

export type AttendeeIdentity = Pick<Attendee, "id" | "name" | "email" | "phone">

export type EventAttendeeRow = {
  id: string
  eventId: string
  attendeeId: string
  status: AttendeeStatus
  uniqueToken: string
  shortCode: string
  createdAt: Date
  attendee: AttendeeIdentity
}

export type EventRow = {
  id: string
  title: string
  startDate: Date
  endDate: Date
  location: string
  status: string
  createdAt: Date
  assignedScanners: { user: { id: string; name: string } }[]
  _count: { eventAttendees: number }
}

export type UserRow = Pick<User, "id" | "name" | "email" | "role" | "createdAt">

export type PerEventStat = {
  id: string
  title: string
  registered: number
  present: number
  percentage: number
}

export type DashboardStats = {
  totalRegistered: number
  totalPresent: number
  totalAbsent: number
  attendancePercentage: number
  hourlyCheckins: { hour: string; count: number }[]
  perEvent: PerEventStat[]
}

export type CheckinAttendee = {
  id: string
  name: string
  email: string
  status: AttendeeStatus
}

export type CheckinResult = {
  status: "SUCCESS" | "DUPLICATE" | "INVALID"
  attendee?: CheckinAttendee
  checkedInAt?: string
  firstCheckinAt?: string
}

export type UploadPreviewRow = {
  row: number
  name: string
  email: string
  phone: string
  error?: string
  duplicate?: boolean
}

export type ApiResponse<T> = {
  data?: T
  error?: string
}

export type UploadPreviewResponse = {
  rows: UploadPreviewRow[]
  validCount: number
  errorCount: number
  duplicateCount: number
}

export type PagedEventAttendeesResponse = {
  data: EventAttendeeRow[]
  total: number
  page: number
  totalPages: number
}

export type PagedEventsResponse = {
  data: EventRow[]
  total: number
  page: number
  totalPages: number
}

export type PagedUsersResponse = {
  data: UserRow[]
  total: number
  page: number
  totalPages: number
}

export type SendQrResponse = {
  sent: number
  failed: number
  errors: { email: string; reason: string }[]
}

export type AssignedEvent = {
  id: string
  title: string
  location: string
  status: string
  startDate: string
  endDate: string
}

declare module "next-auth" {
  interface Session {
    user: SessionUser & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends NextAuthJWT {
    id: string
    role: Role
  }
}
