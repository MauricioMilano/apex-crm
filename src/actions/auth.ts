"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email/send"

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  organizationName: z.string().min(1),
})

export async function loginUser(email: string, password: string, orgSlug?: string) {
  try {
    const user = orgSlug
      ? await prisma.user.findFirst({ where: { email, organization: { slug: orgSlug } } })
      : await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return { success: false as const, error: "Invalid credentials" }
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return { success: false as const, error: "Invalid credentials" }

    const { passwordHash: _, magicLinkToken: _2, magicLinkExpires: _3, ...safeUser } = user
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

    const { passwordHash: _ph, magicLinkToken: _4, magicLinkExpires: _5, ...safeUser } = user

    // Send welcome email (fire-and-forget, OK to fail if SMTP not configured yet)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"
    void sendEmail({
      templateName: "welcome-admin",
      to: user.email,
      variables: {
        adminName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        orgName: org.name,
        loginUrl: `${appUrl}/login`,
        setupUrl: `${appUrl}/settings`,
      },
    })

    return { success: true as const, data: safeUser }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return { success: false as const, error: "User not found" }
    const { passwordHash: _6, magicLinkToken: _7, magicLinkExpires: _8, ...safeUser } = user
    return { success: true as const, data: safeUser }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateUserProfile(
  id: string,
  data: { firstName?: string; lastName?: string; phone?: string; email?: string }
) {
  try {
    // If email is being changed, validate uniqueness
    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } })
      if (existing && existing.id !== id) {
        return { success: false as const, error: "Email is already in use by another account" }
      }
    }
    const user = await prisma.user.update({ where: { id }, data })
    const { passwordHash: _9, magicLinkToken: _10, magicLinkExpires: _11, ...safeUser } = user
    return { success: true as const, data: safeUser }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function changePassword(
  userId: string,
  data: { currentPassword: string; newPassword: string }
) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.passwordHash) {
      return { success: false as const, error: "User not found" }
    }

    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash)
    if (!valid) {
      return { success: false as const, error: "Current password is incorrect" }
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12)
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })

    return { success: true as const, message: "Password changed successfully" }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateClientPortalProfile(
  userId: string,
  data: { firstName?: string; lastName?: string; email?: string; phone?: string },
  clientId?: string
) {
  try {
    // Update the User record first
    const userResult = await updateUserProfile(userId, data)
    if (!userResult.success) {
      return userResult
    }

    // Also update the Client record if clientId is provided
    if (clientId) {
      try {
        await prisma.client.update({
          where: { id: clientId },
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
          },
        })
      } catch {
        // Graceful fallback: if Client record doesn't exist or fails, 
        // the User update has already succeeded
      }
    }

    return { success: true as const, data: userResult.data }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function requestPasswordReset(email: string) {
  try {
    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return { success: true as const, message: "If the email exists, a reset link has been sent." }
    }

    const token = crypto.randomBytes(32).toString("hex")
    const tokenHash = await bcrypt.hash(token, 12)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: tokenHash, resetTokenExpires: expiresAt },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"
    const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

    void sendEmail({
      templateName: "password-reset",
      to: email,
      variables: {
        userName: `${user.firstName} ${user.lastName}`,
        resetUrl,
        orgName: "Apex Business Solutions",
      },
    })

    return { success: true as const, message: "If the email exists, a reset link has been sent." }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function resetPassword(email: string, token: string, newPassword: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.resetToken || !user.resetTokenExpires) {
      return { success: false as const, error: "Invalid or expired reset token" }
    }

    if (user.resetTokenExpires < new Date()) {
      return { success: false as const, error: "Reset token has expired" }
    }

    const valid = await bcrypt.compare(token, user.resetToken)
    if (!valid) {
      return { success: false as const, error: "Invalid reset token" }
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpires: null },
    })

    return { success: true as const, message: "Password has been reset successfully" }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
