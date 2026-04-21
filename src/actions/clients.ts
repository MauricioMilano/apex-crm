"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"

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
      include: { assignee: true },
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
    })
    return { success: true as const, data: client }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateClient(id: string, data: Partial<CreateClientInput>) {
  try {
    const client = await prisma.client.update({
      where: { id },
      data,
    })
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
