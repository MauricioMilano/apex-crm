"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

const createPaymentSchema = z.object({
  amount: z.number().min(0, "Amount must be >= 0"),
  currency: z.string().default("USD"),
  status: z.enum(["pending", "completed", "refunded", "failed"]),
  referenceType: z.enum(["appointment", "subscription"]),
  referenceId: z.string().min(1),
  adjustedPaymentId: z.string().optional(),
  paymentMethodId: z.string().optional(),
  installments: z.number().int().min(1).default(1),
  cardLastFour: z.string().max(4).optional(),
  description: z.string().optional(),
  paidAt: z.string().optional(),
})

type CreatePaymentInput = z.infer<typeof createPaymentSchema>

export async function getPayments(filters?: {
  dateFrom?: string
  dateTo?: string
  referenceType?: string
  referenceId?: string
  status?: string
  paymentMethodId?: string
}) {
  try {
    const where: Prisma.PaymentWhereInput = {
      organizationId: ORG_ID,
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.paidAt = {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
      }
    }

    if (filters?.referenceType) where.referenceType = filters.referenceType
    if (filters?.referenceId) where.referenceId = filters.referenceId
    if (filters?.status) where.status = filters.status as Prisma.EnumPaymentStatusFilter["equals"]
    if (filters?.paymentMethodId) where.paymentMethodId = filters.paymentMethodId

    const payments = await prisma.payment.findMany({
      where,
      include: {
        paymentMethod: true,
      },
      orderBy: { paidAt: "desc" },
    })

    return {
      success: true as const,
      data: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function createPayment(data: CreatePaymentInput) {
  try {
    const parsed = createPaymentSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }

    const payment = await prisma.payment.create({
      data: {
        ...parsed.data,
        organizationId: ORG_ID,
        paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : new Date(),
      },
      include: {
        paymentMethod: true,
      },
    })

    return { success: true as const, data: { ...payment, amount: Number(payment.amount) } }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { success: false as const, error: "Referenced entity not found" }
    }
    return { success: false as const, error: String(error) }
  }
}

export async function updatePaymentStatus(id: string, status: "pending" | "completed" | "refunded" | "failed" | "adjusted") {
  try {
    const payment = await prisma.payment.update({
      where: { id },
      data: { status },
      include: {
        paymentMethod: true,
      },
    })
    return { success: true as const, data: { ...payment, amount: Number(payment.amount) } }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function getPayment(id: string) {
  try {
    const payment = await prisma.payment.findFirst({
      where: { id, organizationId: ORG_ID },
      include: {
        paymentMethod: true,
      },
    })
    if (!payment) return { success: false as const, error: "Payment not found" }
    return { success: true as const, data: { ...payment, amount: Number(payment.amount) } }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
