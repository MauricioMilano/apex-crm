"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { getEligibleSubscriptions } from "./client-subscriptions"

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

function normalizeServicePrice<T extends { price: unknown }>(service: T) {
  return {
    ...service,
    price: Number(service.price),
  }
}

export async function getServices(includeInactive = false) {
  try {
    const services = await prisma.service.findMany({
      where: {
        organizationId: ORG_ID,
        ...(!includeInactive ? { isActive: true } : {}),
      },
      orderBy: { name: "asc" },
    })
    return { success: true as const, data: services.map(normalizeServicePrice) }
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
    return { success: true as const, data: normalizeServicePrice(service) }
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
    return { success: true as const, data: normalizeServicePrice(service) }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateService(id: string, data: Partial<CreateServiceInput>) {
  try {
    const service = await prisma.service.update({ where: { id }, data })
    return { success: true as const, data: normalizeServicePrice(service) }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function deleteService(id: string) {
  try {
    const [service, appointmentCount] = await Promise.all([
      prisma.service.findFirst({
        where: { id, organizationId: ORG_ID },
        select: { id: true },
      }),
      prisma.appointment.count({
        where: { serviceId: id, organizationId: ORG_ID },
      }),
    ])

    if (!service) {
      return { success: false as const, error: "Service not found" }
    }

    if (appointmentCount > 0) {
      return {
        success: false as const,
        error: "Cannot delete a service that has existing appointments",
      }
    }

    await prisma.service.delete({ where: { id } })
    return { success: true as const, data: { id } }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        success: false as const,
        error: "Cannot delete a service that has existing appointments",
      }
    }
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
      data: profile.services.map((es) => normalizeServicePrice(es.service)),
    }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

/**
 * Returns services enriched with plan coverage info for a given client.
 * Each service includes: whether it's covered, eligible subscriptions,
 * remaining appointments, and the standalone price as fallback.
 */
export async function getServicesWithPlanStatus(clientId: string, includeInactive = false) {
  try {
    const services = await prisma.service.findMany({
      where: {
        organizationId: ORG_ID,
        ...(!includeInactive ? { isActive: true } : {}),
      },
      orderBy: { name: "asc" },
    })

    const enriched = await Promise.all(
      services.map(async (svc) => {
        const eligible = await getEligibleSubscriptions(clientId, svc.id)
        const coverage = eligible.success && eligible.data.length > 0
          ? {
              isCovered: true,
              plans: eligible.data,
            }
          : { isCovered: false, plans: [] as Awaited<ReturnType<typeof getEligibleSubscriptions>>["data"] }

        return {
          ...normalizeServicePrice(svc),
          planCoverage: coverage,
        }
      }),
    )

    return { success: true as const, data: enriched }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
