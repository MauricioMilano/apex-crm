"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email/send"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

const createClientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  locationId: z.string().optional(),
  assignedTo: z.string().optional(),
  leadId: z.string().optional(),
})

type CreateClientInput = z.infer<typeof createClientSchema>

export async function getClients(filters?: {
  search?: string
  tags?: string[]
  isActive?: boolean
}) {
  try {
    const where: Prisma.ClientWhereInput = {
      organizationId: ORG_ID,
    }

    if (filters?.isActive !== undefined) where.isActive = filters.isActive
    if (filters?.tags?.length) where.tags = { hasSome: filters.tags }
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { company: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    return { success: true as const, data: clients }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function getClient(id: string) {
  try {
    const client = await prisma.client.findFirst({
      where: { id, organizationId: ORG_ID },
      include: {
        assignee: true,
        location: true,
        appointments: {
          include: { service: true, employee: true },
          orderBy: { startTime: "desc" },
        },
        files: true,
      },
    })
    if (!client) return { success: false as const, error: "Client not found" }
    return { success: true as const, data: client }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function createClient(data: CreateClientInput) {
  try {
    const parsed = createClientSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }
    const { tags, ...rest } = parsed.data
    const client = await prisma.client.create({
      data: {
        ...rest,
        organizationId: ORG_ID,
        tags: tags ?? [],
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    // Send welcome email if NOT from lead conversion (leadId is not set)
    if (!parsed.data.leadId && client.email) {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/portal/login`
      void sendEmail({
        templateName: "client-welcome-admin",
        to: client.email,
        variables: {
          clientName: `${client.firstName} ${client.lastName}`,
          email: client.email,
          orgName: "Apex Business Solutions",
          loginUrl,
          adminName: "Your service team",
        },
      })
    }

    // Notify assignee
    if (client.assignedTo && client.assignee?.email) {
      void sendEmail({
        templateName: "client-assigned",
        to: client.assignee.email,
        variables: {
          employeeName: `${client.assignee.firstName} ${client.assignee.lastName}`,
          clientName: `${client.firstName} ${client.lastName}`,
          email: client.email ?? "",
          phone: client.phone ?? "",
          orgName: "Apex Business Solutions",
        },
      })
    }

    return { success: true as const, data: client }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateClient(id: string, data: Partial<CreateClientInput>) {
  try {
    // Fetch current to detect changes
    const current = await prisma.client.findUnique({
      where: { id },
      select: { assignedTo: true },
    })

    const client = await prisma.client.update({
      where: { id },
      data,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    // Detect assignment change
    if (data.assignedTo && data.assignedTo !== current?.assignedTo && client.assignee?.email) {
      void sendEmail({
        templateName: "client-assigned",
        to: client.assignee.email,
        variables: {
          employeeName: `${client.assignee.firstName} ${client.assignee.lastName}`,
          clientName: `${client.firstName} ${client.lastName}`,
          email: client.email ?? "",
          phone: client.phone ?? "",
          orgName: "Apex Business Solutions",
        },
      })
    }

    return { success: true as const, data: client }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function deleteClient(id: string) {
  try {
    const client = await prisma.client.update({
      where: { id },
      data: { isActive: false },
    })
    return { success: true as const, data: client }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function getClientAppointments(clientId: string) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { clientId, organizationId: ORG_ID },
      include: { service: true, employee: true, location: true },
      orderBy: { startTime: "desc" },
    })
    return { success: true as const, data: appointments }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
