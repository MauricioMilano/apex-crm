"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

const createFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(z.record(z.unknown())).optional(),
  styling: z.record(z.unknown()).optional(),
})

type CreateFormInput = z.infer<typeof createFormSchema>

export async function getForms() {
  try {
    const forms = await prisma.form.findMany({
      where: { organizationId: ORG_ID },
      orderBy: { createdAt: "desc" },
    })
    return { success: true as const, data: forms }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function getForm(id: string) {
  try {
    const form = await prisma.form.findFirst({
      where: { id, organizationId: ORG_ID },
      include: { leads: { orderBy: { createdAt: "desc" } } },
    })
    if (!form) return { success: false as const, error: "Form not found" }
    return { success: true as const, data: form }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function createForm(data: CreateFormInput) {
  try {
    const parsed = createFormSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }
    const form = await prisma.form.create({
      data: {
        organizationId: ORG_ID,
        name: parsed.data.name,
        description: parsed.data.description,
        fields: (parsed.data.fields ?? []) as Prisma.InputJsonValue,
        styling: (parsed.data.styling ?? {}) as Prisma.InputJsonValue,
      },
    })
    return { success: true as const, data: form }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateForm(
  id: string,
  data: Partial<CreateFormInput & { isPublished: boolean }>
) {
  try {
    const form = await prisma.form.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isPublished: data.isPublished,
        fields: data.fields !== undefined ? (data.fields as Prisma.InputJsonValue) : undefined,
        styling: data.styling !== undefined ? (data.styling as Prisma.InputJsonValue) : undefined,
      },
    })
    return { success: true as const, data: form }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function deleteForm(id: string) {
  try {
    await prisma.form.delete({ where: { id } })
    return { success: true as const, data: { id } }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function submitFormEntry(
  formId: string,
  data: Record<string, unknown>
) {
  try {
    const form = await prisma.form.findFirst({
      where: { id: formId, organizationId: ORG_ID, isPublished: true },
    })
    if (!form) {
      return { success: false as const, error: "Form not found or not published" }
    }

    const defaultStatus = await prisma.leadStatus.findFirst({
      where: { organizationId: ORG_ID, isDefault: true },
      orderBy: { order: "asc" },
    })
    if (!defaultStatus) {
      return { success: false as const, error: "No default lead status configured" }
    }

    const lead = await prisma.lead.create({
      data: {
        organizationId: ORG_ID,
        formId,
        statusId: defaultStatus.id,
        firstName: String(data.firstName ?? data.first_name ?? "Unknown"),
        lastName: String(data.lastName ?? data.last_name ?? ""),
        email: data.email ? String(data.email) : undefined,
        phone: data.phone ? String(data.phone) : undefined,
        company: data.company ? String(data.company) : undefined,
        notes: data.notes ? String(data.notes) : undefined,
        source: "form",
        customFields: data as Prisma.InputJsonValue,
      },
    })
    return { success: true as const, data: lead }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
