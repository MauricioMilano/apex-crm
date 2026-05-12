"use server"

import { z } from "zod"
import { prisma } from "@/lib/db"
import { encrypt } from "@/lib/email/encrypt"
import { testSmtpConnection } from "@/lib/email/send"
import { renderTemplate, sampleVariables } from "@/lib/email/renderer"
import { getDefaultTemplate } from "@/lib/email/templates"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

// ─── Zod Schemas ───────────────────────────────────────────────────────────

const updateSettingsSchema = z.object({
  smtpEnabled: z.boolean().optional(),
  smtpHost: z.string().min(1, "SMTP host is required").optional().nullable(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional().nullable(),
  smtpUser: z.string().optional().nullable(),
  smtpPass: z.string().optional().nullable(),
  smtpFrom: z.string().email("Invalid from email").optional().nullable(),
  smtpSecure: z.boolean().optional(),
})

type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>

const updateTemplateSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  bodyHtml: z.string().min(1, "Body HTML is required"),
})

type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>

// ─── Organization Settings ─────────────────────────────────────────────────

export async function getOrganizationSettings() {
  try {
    const settings = await prisma.organizationSetting.findUnique({
      where: { organizationId: ORG_ID },
    })

    if (!settings) {
      // Return defaults — no settings saved yet
      return {
        success: true as const,
        data: {
          smtpEnabled: false,
          smtpHost: null,
          smtpPort: 587,
          smtpUser: null,
          smtpPass: null,
          smtpFrom: null,
          smtpSecure: false,
        },
      }
    }

    // Mask the password
    return {
      success: true as const,
      data: {
        ...settings,
        smtpPass: settings.smtpPass ? "••••••" : null,
      },
    }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateOrganizationSettings(data: UpdateSettingsInput) {
  try {
    const parsed = updateSettingsSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }

    const { smtpPass, ...rest } = parsed.data

    // Build the data object with proper types
    const updateData: {
      smtpEnabled?: boolean
      smtpHost?: string | null
      smtpPort?: number | null
      smtpUser?: string | null
      smtpPass?: string | null
      smtpFrom?: string | null
      smtpSecure?: boolean
    } = { ...rest }

    // Encrypt password if provided and changed
    if (smtpPass !== undefined && smtpPass !== null && smtpPass !== "••••••") {
      updateData.smtpPass = encrypt(smtpPass)
    } else if (smtpPass === null) {
      updateData.smtpPass = null
    }
    // If smtpPass is "••••••", keep existing (don't include in update)

    const createData: {
      organizationId: string
      smtpEnabled?: boolean
      smtpHost?: string | null
      smtpPort?: number
      smtpUser?: string | null
      smtpPass?: string | null
      smtpFrom?: string | null
      smtpSecure?: boolean
    } = {
      organizationId: ORG_ID,
      smtpEnabled: updateData.smtpEnabled,
      smtpHost: updateData.smtpHost,
      smtpPort: updateData.smtpPort ?? 587,
      smtpUser: updateData.smtpUser,
      smtpPass: updateData.smtpPass,
      smtpFrom: updateData.smtpFrom,
      smtpSecure: updateData.smtpSecure,
    }

    const settings = await prisma.organizationSetting.upsert({
      where: { organizationId: ORG_ID },
      create: createData,
      update: updateData,
    })

    return { success: true as const, data: { ...settings, smtpPass: "••••••" } }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function testSmtpConnectionAction(to?: string) {
  try {
    const result = await testSmtpConnection(to)
    return result.success
      ? { success: true as const, message: "SMTP connection successful!" }
      : { success: false as const, error: result.error ?? "Connection failed" }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────

export async function getEmailTemplates() {
  try {
    const templates = await prisma.emailTemplate.findMany({
      where: { organizationId: ORG_ID },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    })

    // Merge with default templates so we always show all 3
    const defaults = [
      { name: "appointment-confirmed", category: "appointment" },
      { name: "lead-notification", category: "lead" },
      { name: "client-welcome", category: "client" },
    ]

    const merged = defaults.map((def) => {
      const db = templates.find((t) => t.name === def.name)
      const fallback = getDefaultTemplate(def.name)
      return {
        id: db?.id ?? `default-${def.name}`,
        organizationId: ORG_ID,
        name: def.name,
        subject: db?.subject ?? fallback?.subject ?? "",
        bodyHtml: db?.bodyHtml ?? fallback?.bodyHtml ?? "",
        category: def.category,
        isDefault: db?.isDefault ?? true,
        createdAt: db?.createdAt.toISOString() ?? new Date().toISOString(),
        updatedAt: db?.updatedAt.toISOString() ?? new Date().toISOString(),
        isCustomized: !!db,
      }
    })

    return { success: true as const, data: merged }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function getEmailTemplate(name: string) {
  try {
    const dbTemplate = await prisma.emailTemplate.findUnique({
      where: {
        organizationId_name: {
          organizationId: ORG_ID,
          name,
        },
      },
    })

    const fallback = getDefaultTemplate(name)
    if (!dbTemplate && !fallback) {
      return { success: false as const, error: `Template "${name}" not found` }
    }

    return {
      success: true as const,
      data: {
        id: dbTemplate?.id ?? `default-${name}`,
        organizationId: ORG_ID,
        name,
        subject: dbTemplate?.subject ?? fallback!.subject,
        bodyHtml: dbTemplate?.bodyHtml ?? fallback!.bodyHtml,
        category: fallback?.category ?? "appointment",
        isDefault: dbTemplate?.isDefault ?? true,
        createdAt: dbTemplate?.createdAt.toISOString() ?? new Date().toISOString(),
        updatedAt: dbTemplate?.updatedAt.toISOString() ?? new Date().toISOString(),
        isCustomized: !!dbTemplate,
      },
    }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateEmailTemplate(name: string, data: UpdateTemplateInput) {
  try {
    const parsed = updateTemplateSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }

    const fallback = getDefaultTemplate(name)
    if (!fallback) {
      return { success: false as const, error: `Template "${name}" does not exist` }
    }

    const template = await prisma.emailTemplate.upsert({
      where: {
        organizationId_name: {
          organizationId: ORG_ID,
          name,
        },
      },
      create: {
        organizationId: ORG_ID,
        name,
        subject: parsed.data.subject,
        bodyHtml: parsed.data.bodyHtml,
        category: fallback.category,
        isDefault: false,
      },
      update: {
        subject: parsed.data.subject,
        bodyHtml: parsed.data.bodyHtml,
        isDefault: false,
      },
    })

    return { success: true as const, data: template }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function previewTemplate(name: string) {
  try {
    const fallback = getDefaultTemplate(name)
    if (!fallback) {
      return { success: false as const, error: `Template "${name}" does not exist` }
    }

    const sampleVars = sampleVariables[name]
    if (!sampleVars) {
      return { success: false as const, error: `No sample data for template "${name}"` }
    }

    const subject = renderTemplate(fallback.subject, sampleVars)
    const bodyHtml = renderTemplate(fallback.bodyHtml, sampleVars)

    return {
      success: true as const,
      data: { subject, bodyHtml },
    }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
