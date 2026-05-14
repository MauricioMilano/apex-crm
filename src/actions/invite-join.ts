"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db"
import { SESSION_COOKIE } from "@/lib/api-helpers"

const joinSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
  email: z.string().email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type JoinInput = z.infer<typeof joinSchema>

export async function joinViaInvite(data: JoinInput) {
  try {
    const parsed = joinSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }

    const { token, email, firstName, lastName, password } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.resetToken || !user.resetTokenExpires) {
      return { success: false as const, error: "Invalid or expired invite token" }
    }

    if (user.resetTokenExpires < new Date()) {
      return { success: false as const, error: "Invite token has expired" }
    }

    const valid = await bcrypt.compare(token, user.resetToken)
    if (!valid) {
      return { success: false as const, error: "Invalid invite token" }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        passwordHash,
        isActive: true,
        resetToken: null,
        resetTokenExpires: null,
      },
    })

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, updatedUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    const { passwordHash: _ph, magicLinkToken: _2, magicLinkExpires: _3, ...safeUser } = updatedUser
    return { success: true as const, data: safeUser }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
