export const attendeeIdentitySelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
} as const

export const eventAttendeeSelect = {
  id: true,
  eventId: true,
  attendeeId: true,
  status: true,
  uniqueToken: true,
  shortCode: true,
  createdAt: true,
  attendee: { select: { id: true, name: true, email: true, phone: true } },
} as const

export const eventSelect = {
  id: true,
  title: true,
  startDate: true,
  endDate: true,
  location: true,
  status: true,
  createdAt: true,
  assignedScanners: { select: { user: { select: { id: true, name: true } } } },
  _count: { select: { eventAttendees: true } },
} as const

export const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const

export const attendanceLogSelect = {
  id: true,
  eventAttendeeId: true,
  scannedAt: true,
  scannedBy: true,
  gateName: true,
} as const
