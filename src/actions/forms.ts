"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email/send"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const createFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(z.record(z.unknown())).optional(),
  styling: z.record(z.unknown()).optional(),
})

// Schema for core form submission data (standardized fields)
const coreSubmissionSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
})

// Schema for dynamic custom fields from form
const customFieldsSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean()])
)

// Combined schema with optional custom fields
const formSubmissionSchema = coreSubmissionSchema.and(customFieldsSchema.optional())

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

export async function toggleFormStatus(formId: string) {
  try {
    // Fetch current form to get its organization and current published state
    const current = await prisma.form.findFirst({
      where: { id: formId },
    })
    
    if (!current) {
      return { success: false as const, error: "Form not found" }
    }

    // Toggle the isPublished flag
    const newPublishedState = !current.isPublished
    
    const updated = await prisma.form.update({
      where: { id: formId },
      data: { isPublished: newPublishedState },
    })
    
    return { success: true as const, data: updated }
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
    // Validate core fields against schema
    const parsed = formSubmissionSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: "Invalid submission data" }
    }

    // Fetch the form to verify it exists and is published
    const form = await prisma.form.findFirst({
      where: { id: formId, organizationId: ORG_ID },
    })
    if (!form) {
      return { success: false as const, error: "Form not found or unauthorized" }
    }

    // Check if form is published
    if (!form.isPublished) {
      return { 
        success: false as const, 
        error: "FORM_NOT_PUBLISHED",
        message: "This form has not been published yet. Please contact the administrator." 
      }
    }

    // Get default lead status for this organization
    const defaultStatus = await prisma.leadStatus.findFirst({
      where: { organizationId: ORG_ID, isDefault: true },
      orderBy: { order: "asc" },
    })
    if (!defaultStatus) {
      return { success: false as const, error: "No default lead status configured" }
    }

    // Map core fields to standardized names for database insertion
    const mappedData = {
      organizationId: ORG_ID,
      formId,
      statusId: defaultStatus.id,
      firstName: String(parsed.data.firstName ?? "Unknown"),
      lastName: String(parsed.data.lastName ?? ""),
      email: parsed.data.email ? String(parsed.data.email) : undefined,
      phone: parsed.data.phone ? String(parsed.data.phone) : undefined,
      company: parsed.data.company ? String(parsed.data.company) : undefined,
      notes: parsed.data.notes ? String(parsed.data.notes) : undefined,
      source: "form",
    }

    // Map custom fields - transform dynamic form field data into structured JSON
    const customFields: Record<string, unknown> = {}
    if (parsed.data.customFields && typeof parsed.data.customFields === 'object') {
      for (const [key, value] of Object.entries(parsed.data.customFields)) {
        // Convert values to appropriate types based on expected format
        let typedValue: unknown = value
        
        // Handle string representations of numbers/booleans
        if (typeof value === 'string') {
          const num = Number(value)
          if (!isNaN(num) && String(num) !== value) {
            typedValue = num
          } else if (value.toLowerCase() === 'true') {
            typedValue = true
          } else if (value.toLowerCase() === 'false') {
            typedValue = false
          }
        }
        
        customFields[key] = typedValue
      }
    }

    // Create the Lead record with mapped data and custom fields
    const lead = await prisma.lead.create({
      data: { ...mappedData, customFields: customFields as Prisma.InputJsonValue },
    })
    
    // Send lead notification email to org's configured from address
    const settings = await prisma.organizationSetting.findUnique({
      where: { organizationId: ORG_ID },
    })
    const notifyEmail = settings?.smtpFrom
    if (notifyEmail) {
      void sendEmail({
        templateName: "lead-notification",
        to: notifyEmail,
        variables: {
          firstName: String(parsed.data.firstName ?? "Unknown"),
          lastName: String(parsed.data.lastName ?? ""),
          email: String(parsed.data.email ?? ""),
          phone: String(parsed.data.phone ?? ""),
          company: String(parsed.data.company ?? ""),
          service: form.name,
          orgName: "Apex Business Solutions",
        },
      })
    }
    
    return { success: true as const, data: lead }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
