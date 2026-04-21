"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  organizationName: z.string().min(1),
})

export async function loginUser(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return { success: false as const, error: "Invalid credentials" }
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return { success: false as const, error: "Invalid credentials" }

    const { passwordHash, magicLinkToken, magicLinkExpires, ...safeUser } = user
    return { success: true as const, data: safeUser }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function registerUser(data: {
  firstName: string
  lastName: string
  email: string
  password: string
  organizationName: string
}) {
  try {
    const parsed = registerSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })
    if (existing) {
      return { success: false as const, error: "Email already registered" }
    }

    const slug = parsed.data.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const passwordHash = await bcrypt.hash(parsed.data.password, 12)

    const org = await prisma.organization.create({
      data: { name: parsed.data.organizationName, slug },
    })

    const user = await prisma.user.create({
      data: {
        organizationId: org.id,
        email: parsed.data.email,
        passwordHash,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        role: "admin",
      },
    })

    const { passwordHash: _ph, magicLinkToken, magicLinkExpires, ...safeUser } = user
    return { success: true as const, data: safeUser }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return { success: false as const, error: "User not found" }
    const { passwordHash, magicLinkToken, magicLinkExpires, ...safeUser } = user
    return { success: true as const, data: safeUser }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateUserProfile(
  id: string,
  data: { firstName?: string; lastName?: string; phone?: string }
) {
  try {
    const user = await prisma.user.update({ where: { id }, data })
    const { passwordHash, magicLinkToken, magicLinkExpires, ...safeUser } = user
    return { success: true as const, data: safeUser }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
