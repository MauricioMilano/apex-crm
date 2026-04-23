"use server"

import { z } from "zod"
import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/db"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

export async function getOrganization(id: string) {
  try {
    const org = await prisma.organization.findUnique({ where: { id } })
    if (!org) return { success: false as const, error: "Organization not found" }
    return { success: true as const, data: org }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateOrganization(
  id: string,
  data: Partial<{ name: string; logo: string }>
) {
  try {
    const org = await prisma.organization.update({ where: { id }, data })
    return { success: true as const, data: org }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

const createLocationSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  timezone: z.string().optional(),
})

type CreateLocationInput = z.infer<typeof createLocationSchema>

export async function getLocations() {
  try {
    const locations = await prisma.location.findMany({
      where: { organizationId: ORG_ID },
      orderBy: { name: "asc" },
    })
    return { success: true as const, data: locations }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function createLocation(data: CreateLocationInput) {
  try {
    const parsed = createLocationSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }
    const location = await prisma.location.create({
      data: { ...parsed.data, organizationId: ORG_ID },
    })
    return { success: true as const, data: location }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateLocation(id: string, data: Partial<CreateLocationInput>) {
  try {
    const location = await prisma.location.update({ where: { id }, data })
    return { success: true as const, data: location }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function deleteLocation(id: string) {
  try {
    await prisma.location.delete({ where: { id } })
    return { success: true as const, data: { id } }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

const userSelectFields = {
  id: true,
  organizationId: true,
  locationId: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatar: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      where: { organizationId: ORG_ID },
      select: userSelectFields,
      orderBy: { firstName: "asc" },
    })
    return { success: true as const, data: users }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateUserRole(id: string, role: UserRole) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: userSelectFields,
    })
    return { success: true as const, data: user }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function deactivateUser(id: string) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: userSelectFields,
    })
    return { success: true as const, data: user }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function inviteTeamMember(data: {
  organizationId: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
}) {
  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) return { success: false as const, error: "Email already registered" }
    const tempPassword = randomBytes(16).toString("hex")
    const passwordHash = await bcrypt.hash(tempPassword, 12)
    const user = await prisma.user.create({
      data: {
        organizationId: data.organizationId,
        email: data.email,
        firstName: data.firstName || "New",
        lastName: data.lastName || "Member",
        role: data.role,
        passwordHash,
        isActive: true,
      },
      select: userSelectFields,
    })
    return { success: true as const, data: user }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
