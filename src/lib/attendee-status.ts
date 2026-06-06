export type AttendeeStatusColor = "success" | "info" | "error" | "default"

export function attendeeStatusColor(value: string): AttendeeStatusColor {
  if (value === "PRESENT") return "success"
  if (value === "INVITED") return "info"
  if (value === "ABSENT") return "error"
  return "default"
}

export function attendeeStatusLabel(value: string): string {
  if (value === "PRESENT") return "Present"
  if (value === "INVITED") return "Invited"
  if (value === "ABSENT") return "Absent"
  return "Registered"
}
