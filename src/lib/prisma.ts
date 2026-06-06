import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../generated/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const connectionString = process.env.DATABASE_URL ?? ""
const adapter = new PrismaPg({ connectionString })

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter, log: ["error"] })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
