"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db"
import { SESSION_COOKIE } from "@/lib/api-helpers"
import { sendEmail } from "@/lib/email/send"

const registerClientSchema = z.object({
  orgSlug: z.string().min(1, "Organization slug is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type RegisterClientInput = z.infer<typeof registerClientSchema>

export async function registerClient(data: RegisterClientInput) {
  try {
    const parsed = registerClientSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }

    const { orgSlug, firstName, lastName, email, password } = parsed.data

    // Lookup organization by slug
    const org = await prisma.organization.findUnique({ where: { slug: orgSlug } })
    if (!org) {
      return { success: false as const, error: "Invalid registration link. Organization not found." }
    }

    // Check if email already exists in this org
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return { success: false as const, error: "Email already registered" }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // Create User + Client atomically
    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          organizationId: org.id,
          email,
          passwordHash,
          firstName,
          lastName,
          role: "client",
        },
      }),
      prisma.client.create({
        data: {
          organizationId: org.id,
          firstName,
          lastName,
          email,
          isActive: true,
        },
      }),
    ])

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    // Send welcome email
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/portal/login`
    void sendEmail({
      templateName: "client-welcome",
      to: email,
      variables: {
        clientName: `${firstName} ${lastName}`,
        email,
        orgName: org.name,
        loginUrl,
      },
    })

    const { passwordHash: _ph, magicLinkToken, magicLinkExpires, ...safeUser } = user
    return { success: true as const, data: safeUser }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function lookupOrgBySlug(slug: string) {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    })
    if (!org) return { success: false as const, error: "Organization not found" }
    return { success: true as const, data: org }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
