import NextAuth from "next-auth"
import Nodemailer from "next-auth/providers/nodemailer"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { getAuthMailServer, sendMagicLinkEmail } from "@/lib/email"
import { prisma } from "@/lib/prisma"
import { Role } from "@/types"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Nodemailer({
      server: getAuthMailServer(),
      from: process.env.SUPPORT_EMAIL,
      async sendVerificationRequest({ identifier, url }) {
        const host = new URL(url).host
        await sendMagicLinkEmail({
          email: identifier,
          url,
          host,
        })
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Only allow sign-in for emails that already exist in our User table
      if (account?.provider === "nodemailer") {
        if (!user.email) return false
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true },
        })
        return Boolean(existingUser)
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
      }
      // Resolve role from DB on sign-in and whenever it's missing from the token
      if (user || !token.role) {
        const email = (user as (typeof user & { email?: string | null }) | undefined)?.email ?? token.email
        if (email) {
          const dbUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true, role: true },
          })
          token.role = (dbUser?.role as Role | undefined) ?? Role.SCANNER
          if (dbUser?.id) token.id = dbUser.id
        } else {
          token.role = Role.SCANNER
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
})
