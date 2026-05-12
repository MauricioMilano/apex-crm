"use server"

import { z } from "zod"
import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email/send"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

// ── Allowed values for regional settings ──────────────────────────────────

const ALLOWED_TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Phoenix", "America/Anchorage", "Pacific/Honolulu",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Rome",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata", "Asia/Dubai",
  "Australia/Sydney", "Australia/Melbourne", "Pacific/Auckland",
] as const

const ALLOWED_DATE_FORMATS = [
  "MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD", "MMM D, YYYY",
] as const

const ALLOWED_CURRENCIES = [
  "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "BRL", "MXN",
] as const

const ALLOWED_TIME_FORMATS = ["12h", "24h"] as const

const organizationSettingsSchema = z.object({
  currency: z.enum(ALLOWED_CURRENCIES).optional(),
  timezone: z.enum(ALLOWED_TIMEZONES).optional(),
  dateFormat: z.enum(ALLOWED_DATE_FORMATS).optional(),
  timeFormat: z.enum(ALLOWED_TIME_FORMATS).optional(),
  locale: z.string().min(2).optional().nullable(),
})

type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>

// ── Default settings ───────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  currency: "USD",
  timezone: "America/New_York",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  locale: "en-US",
} as const

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

// ── Organization Settings ─────────────────────────────────────────────────

export async function getOrganizationSettings(organizationId: string) {
  try {
    let settings = await prisma.organizationSetting.findUnique({
      where: { organizationId },
    })
    if (!settings) {
      settings = await prisma.organizationSetting.create({
        data: { organizationId, ...DEFAULT_SETTINGS },
      })
    }
    const { smtpPass: _smtpPass, ...safe } = settings
    void _smtpPass
    return { success: true as const, data: safe }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateOrganizationSettings(
  organizationId: string,
  data: OrganizationSettingsInput
) {
  try {
    const parsed = organizationSettingsSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }
    // Ensure a record exists before updating
    await getOrganizationSettings(organizationId)
    const updated = await prisma.organizationSetting.update({
      where: { organizationId },
      data: parsed.data,
    })
    const { smtpPass: _smtpPass, ...safe } = updated
    void _smtpPass
    return { success: true as const, data: safe }
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

    // Send invitation email
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/login`
    const emailResult = await sendEmail({
      templateName: "team-invite",
      to: data.email,
      variables: {
        invitedName: `${data.firstName} ${data.lastName}`.trim() || "New Member",
        email: data.email,
        tempPassword,
        orgName: "Apex Business Solutions",
        invitedBy: "Your admin",
        loginUrl,
      },
    })

    return {
      success: true as const,
      data: {
        ...user,
        tempPassword,
        emailSent: emailResult.success,
        emailWarning: emailResult.success ? undefined : "User created but email not sent. SMTP may be disabled.",
      },
    }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
