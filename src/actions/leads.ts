"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email/send"

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
      include: {
        status: true,
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
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
      include: { status: true, assignee: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
      }, location: true, form: true },
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
      include: { status: true, assignee: { select: { id: true, firstName: true, lastName: true, email: true } } },
    })

    // Notify assignee if set
    if (lead.assignedTo && lead.assignee?.email) {
      void sendEmail({
        templateName: "lead-assigned",
        to: lead.assignee.email,
        variables: {
          employeeName: `${lead.assignee.firstName} ${lead.assignee.lastName}`,
          leadName: `${lead.firstName} ${lead.lastName}`,
          email: lead.email ?? "",
          phone: lead.phone ?? "",
          company: lead.company ?? "",
          source: lead.source ?? "Manual entry",
          orgName: "Apex Business Solutions",
        },
      })
    }

    // Notify org about new manual lead
    const settings = await prisma.organizationSetting.findUnique({
      where: { organizationId: ORG_ID },
    })
    if (settings?.smtpFrom) {
      void sendEmail({
        templateName: "lead-notification",
        to: settings.smtpFrom,
        variables: {
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email ?? "",
          phone: lead.phone ?? "",
          company: lead.company ?? "",
          service: "Manual entry",
          orgName: "Apex Business Solutions",
        },
      })
    }

    return { success: true as const, data: lead }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateLead(id: string, data: Partial<CreateLeadInput>) {
  try {
    // Fetch current to detect changes
    const current = await prisma.lead.findUnique({
      where: { id },
      include: {
        status: { select: { name: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })
    if (!current) return { success: false as const, error: "Lead not found" }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...data,
        tags: data.tags ?? undefined,
      },
      include: { status: true, assignee: { select: { id: true, firstName: true, lastName: true, email: true } } },
    })

    // Detect assignment change
    if (data.assignedTo && data.assignedTo !== current.assignedTo && lead.assignee?.email) {
      void sendEmail({
        templateName: "lead-assigned",
        to: lead.assignee.email,
        variables: {
          employeeName: `${lead.assignee.firstName} ${lead.assignee.lastName}`,
          leadName: `${lead.firstName} ${lead.lastName}`,
          email: lead.email ?? "",
          phone: lead.phone ?? "",
          company: lead.company ?? "",
          source: lead.source ?? "Manual entry",
          orgName: "Apex Business Solutions",
        },
      })
    }

    // Detect status change
    if (data.statusId && data.statusId !== current.statusId && current.assignee?.email) {
      const newStatus = lead.status?.name ?? "Changed"
      const oldStatus = current.status?.name ?? "Unknown"
      void sendEmail({
        templateName: "lead-status-changed",
        to: current.assignee.email,
        variables: {
          leadName: `${lead.firstName} ${lead.lastName}`,
          oldStatus,
          newStatus,
          orgName: "Apex Business Solutions",
        },
      })
    }

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

    // Send conversion email
    if (lead.email) {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/portal/login`
      void sendEmail({
        templateName: "lead-converted",
        to: lead.email,
        variables: {
          clientName: `${lead.firstName} ${lead.lastName}`,
          email: lead.email,
          orgName: "Apex Business Solutions",
          loginUrl,
        },
      })
    }

    return { success: true as const, data: client }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
