"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

const createPlanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be >= 0"),
  billingPeriod: z.enum(["monthly", "quarterly", "semiannual", "annual"]),
  maxApptsPerPeriod: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  serviceIds: z.array(z.string()).optional(),
})

type CreatePlanInput = z.infer<typeof createPlanSchema>

function normalizePlanPrice<T extends { price: unknown }>(plan: T) {
  return { ...plan, price: Number(plan.price) }
}

export async function getPlans(includeInactive = false) {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        organizationId: ORG_ID,
        ...(!includeInactive ? { isActive: true } : {}),
      },
      include: { planServices: { include: { service: true } } },
      orderBy: { name: "asc" },
    })
    return {
      success: true as const,
      data: plans.map((p) => ({
        ...normalizePlanPrice(p),
        services: p.planServices.map((ps) => ({
          serviceId: ps.serviceId,
          serviceName: ps.service.name,
          maxPerPeriod: ps.maxPerPeriod,
        })),
      })),
    }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function getPlan(id: string) {
  try {
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { id, organizationId: ORG_ID },
      include: { planServices: { include: { service: true } } },
    })
    if (!plan) return { success: false as const, error: "Plan not found" }
    return {
      success: true as const,
      data: {
        ...normalizePlanPrice(plan),
        services: plan.planServices.map((ps) => ({
          serviceId: ps.serviceId,
          serviceName: ps.service.name,
          maxPerPeriod: ps.maxPerPeriod,
        })),
      },
    }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function createPlan(data: CreatePlanInput) {
  try {
    const parsed = createPlanSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }

    const { serviceIds, ...planData } = parsed.data

    const plan = await prisma.subscriptionPlan.create({
      data: {
        ...planData,
        organizationId: ORG_ID,
        ...(serviceIds && serviceIds.length > 0
          ? {
              planServices: {
                create: serviceIds.map((serviceId) => ({ serviceId })),
              },
            }
          : {}),
      },
      include: { planServices: true },
    })

    return { success: true as const, data: normalizePlanPrice(plan) }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false as const, error: "A plan with these details already exists" }
    }
    return { success: false as const, error: String(error) }
  }
}

export async function updatePlan(id: string, data: Partial<CreatePlanInput>) {
  try {
    const { serviceIds, ...planData } = data

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: planData,
    })

    if (serviceIds !== undefined) {
      await prisma.subscriptionPlanService.deleteMany({ where: { planId: id } })
      if (serviceIds.length > 0) {
        await prisma.subscriptionPlanService.createMany({
          data: serviceIds.map((serviceId) => ({ planId: id, serviceId })),
        })
      }
    }

    return { success: true as const, data: normalizePlanPrice(plan) }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function deletePlan(id: string) {
  try {
    const [plan, subscriptionCount] = await Promise.all([
      prisma.subscriptionPlan.findFirst({
        where: { id, organizationId: ORG_ID },
        select: { id: true },
      }),
      prisma.clientSubscription.count({
        where: { planId: id },
      }),
    ])

    if (!plan) {
      return { success: false as const, error: "Plan not found" }
    }

    if (subscriptionCount > 0) {
      return {
        success: false as const,
        error: "Cannot delete a plan that has active client subscriptions",
      }
    }

    await prisma.subscriptionPlanService.deleteMany({ where: { planId: id } })
    await prisma.subscriptionPlan.delete({ where: { id } })
    return { success: true as const, data: { id } }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        success: false as const,
        error: "Cannot delete a plan that has existing client subscriptions",
      }
    }
    return { success: false as const, error: String(error) }
  }
}
