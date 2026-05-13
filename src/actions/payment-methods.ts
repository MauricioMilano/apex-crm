"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

const createPaymentMethodSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").toLowerCase(),
  requiresDocs: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

const updatePaymentMethodSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).toLowerCase().optional(),
  requiresDocs: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>
type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>

export async function getPaymentMethods(includeInactive = false) {
  try {
    const where: Prisma.PaymentMethodWhereInput = {
      organizationId: ORG_ID,
      ...(includeInactive ? {} : { isActive: true }),
    }

    const methods = await prisma.paymentMethod.findMany({
      where,
      orderBy: { createdAt: "asc" },
    })

    return { success: true as const, data: methods }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function getPaymentMethod(id: string) {
  try {
    const method = await prisma.paymentMethod.findFirst({
      where: { id, organizationId: ORG_ID },
    })
    if (!method) return { success: false as const, error: "Payment method not found" }
    return { success: true as const, data: method }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function createPaymentMethod(data: CreatePaymentMethodInput) {
  try {
    const parsed = createPaymentMethodSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }

    const method = await prisma.paymentMethod.create({
      data: {
        ...parsed.data,
        organizationId: ORG_ID,
      },
    })

    return { success: true as const, data: method }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false as const, error: "A payment method with this code already exists" }
    }
    return { success: false as const, error: String(error) }
  }
}

export async function updatePaymentMethod(id: string, data: UpdatePaymentMethodInput) {
  try {
    const parsed = updatePaymentMethodSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }

    const method = await prisma.paymentMethod.update({
      where: { id },
      data: parsed.data,
    })

    return { success: true as const, data: method }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false as const, error: "A payment method with this code already exists" }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false as const, error: "Payment method not found" }
    }
    return { success: false as const, error: String(error) }
  }
}

export async function deletePaymentMethod(id: string) {
  try {
    await prisma.paymentMethod.delete({ where: { id } })
    return { success: true as const, data: { id } }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false as const, error: "Payment method not found" }
    }
    return { success: false as const, error: String(error) }
  }
}
