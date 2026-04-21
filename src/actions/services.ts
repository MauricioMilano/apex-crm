"use server"

import { z } from "zod"
import { prisma } from "@/lib/db"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

const createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().int().positive(),
  price: z.number().min(0),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
})

type CreateServiceInput = z.infer<typeof createServiceSchema>

export async function getServices(includeInactive = false) {
  try {
    const services = await prisma.service.findMany({
      where: {
        organizationId: ORG_ID,
        ...(!includeInactive ? { isActive: true } : {}),
      },
      orderBy: { name: "asc" },
    })
    return { success: true as const, data: services }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function getService(id: string) {
  try {
    const service = await prisma.service.findFirst({
      where: { id, organizationId: ORG_ID },
    })
    if (!service) return { success: false as const, error: "Service not found" }
    return { success: true as const, data: service }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function createService(data: CreateServiceInput) {
  try {
    const parsed = createServiceSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }
    const service = await prisma.service.create({
      data: { ...parsed.data, organizationId: ORG_ID },
    })
    return { success: true as const, data: service }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateService(id: string, data: Partial<CreateServiceInput>) {
  try {
    const service = await prisma.service.update({ where: { id }, data })
    return { success: true as const, data: service }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function deleteService(id: string) {
  try {
    await prisma.service.delete({ where: { id } })
    return { success: true as const, data: { id } }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function getEmployeeServices(employeeId: string) {
  try {
    const profile = await prisma.employeeProfile.findUnique({
      where: { userId: employeeId },
      include: {
        services: { include: { service: true } },
      },
    })
    if (!profile) return { success: false as const, error: "Employee not found" }
    return {
      success: true as const,
      data: profile.services.map((es) => es.service),
    }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
