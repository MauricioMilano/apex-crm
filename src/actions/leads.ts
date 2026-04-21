"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

const createLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  value: z.number().optional(),
  tags: z.array(z.string()).optional(),
  statusId: z.string().min(1),
  assignedTo: z.string().optional(),
  locationId: z.string().optional(),
})

type CreateLeadInput = z.infer<typeof createLeadSchema>

export async function getLeads(filters?: {
  statusId?: string
  assignedTo?: string
  search?: string
}) {
  try {
    const where: Prisma.LeadWhereInput = {
      organizationId: ORG_ID,
    }

    if (filters?.statusId) where.statusId = filters.statusId
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { company: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    const leads = await prisma.lead.findMany({
      where,
      include: { status: true, assignee: true },
      orderBy: { createdAt: "desc" },
    })
    return { success: true as const, data: leads }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function getLead(id: string) {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id, organizationId: ORG_ID },
      include: { status: true, assignee: true, location: true, form: true },
    })
    if (!lead) return { success: false as const, error: "Lead not found" }
    return { success: true as const, data: lead }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function createLead(data: CreateLeadInput) {
  try {
    const parsed = createLeadSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }
    const { value, tags, ...rest } = parsed.data
    const lead = await prisma.lead.create({
      data: {
        ...rest,
        organizationId: ORG_ID,
        value: value !== undefined ? value : undefined,
        tags: tags ?? [],
      },
      include: { status: true },
    })
    return { success: true as const, data: lead }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateLead(id: string, data: Partial<CreateLeadInput>) {
  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...data,
        tags: data.tags ?? undefined,
      },
      include: { status: true },
    })
    return { success: true as const, data: lead }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function deleteLead(id: string) {
  try {
    await prisma.lead.delete({ where: { id } })
    return { success: true as const, data: { id } }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function convertLeadToClient(leadId: string) {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: ORG_ID },
    })
    if (!lead) return { success: false as const, error: "Lead not found" }
    if (lead.convertedToClientId) {
      return { success: false as const, error: "Lead already converted to a client" }
    }

    const client = await prisma.client.create({
      data: {
        organizationId: ORG_ID,
        locationId: lead.locationId,
        assignedTo: lead.assignedTo,
        leadId: lead.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        notes: lead.notes,
        tags: lead.tags,
      },
    })

    await prisma.lead.update({
      where: { id: leadId },
      data: { convertedToClientId: client.id },
    })

    return { success: true as const, data: client }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
