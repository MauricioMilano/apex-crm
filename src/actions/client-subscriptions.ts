"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email/send"
import { scheduleEmail } from "@/lib/email/scheduler"
import { getBillingPeriodDays, calculateProRata, getActiveDays } from "@/lib/billing"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

const assignPlanSchema = z.object({
  clientId: z.string().min(1),
  planId: z.string().min(1),
})

/**
 * Generate a Payment record for a subscription event.
 */
async function generateSubscriptionPayment(
  subscriptionId: string,
  planId: string,
  amount: number,
  description: string,
  status: "completed" | "refunded",
  paidAt: Date,
) {
  await prisma.payment.create({
    data: {
      organizationId: ORG_ID,
      amount: new Prisma.Decimal(amount),
      status,
      referenceType: "subscription",
      referenceId: subscriptionId,
      description,
      paidAt,
    },
  })
}

/**
 * Auto-advance subscription period if currentPeriodEnd is in the past.
 * Uses the plan's billingPeriod for duration. Generates a Payment on renewal.
 */
async function renewPeriodIfNeeded(subscription: {
  id: string
  planId: string
  status: string
  currentPeriodEnd: Date
  endDate: Date | null
}): Promise<boolean> {
  if (subscription.status !== "active") return false
  if (subscription.endDate && subscription.endDate <= new Date()) {
    await prisma.clientSubscription.update({
      where: { id: subscription.id },
      data: { status: "expired" },
    })
    return false
  }
  if (subscription.currentPeriodEnd <= new Date()) {
    // Fetch plan to get billing period and price
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: subscription.planId },
      select: { billingPeriod: true, price: true, name: true },
    })
    if (!plan) return false

    const periodDays = getBillingPeriodDays(plan.billingPeriod)
    const now = new Date()
    const periodEnd = new Date(
      subscription.currentPeriodEnd.getTime() + periodDays * 24 * 60 * 60 * 1000
    )

    const updated = await prisma.clientSubscription.update({
      where: { id: subscription.id },
      data: {
        currentPeriodStart: subscription.currentPeriodEnd,
        currentPeriodEnd: periodEnd,
        appointmentsUsed: 0,
      },
      include: {
        client: { select: { firstName: true, lastName: true, email: true } },
        plan: { select: { name: true } },
      },
    })

    // Generate payment for renewal
    const planPrice = Number(plan.price)
    await generateSubscriptionPayment(
      subscription.id,
      subscription.planId,
      planPrice,
      `Renovation - ${plan.name}`,
      "completed",
      now,
    )

    // Schedule renewal notification
    if (updated.client?.email) {
      void scheduleEmail({
        templateName: "subscription-renewed",
        to: updated.client.email,
        variables: {
          clientName: `${updated.client.firstName} ${updated.client.lastName}`,
          planName: updated.plan?.name ?? "Subscription",
          newPeriodStart: updated.currentPeriodStart.toLocaleDateString(),
          newPeriodEnd: updated.currentPeriodEnd.toLocaleDateString(),
          orgName: "Apex Business Solutions",
        },
        scheduledFor: new Date(),
        referenceType: "subscription",
        referenceId: subscription.id,
      })
    }

    return true
  }
  return false
}

export async function getClientSubscriptions(clientId: string) {
  try {
    const subs = await prisma.clientSubscription.findMany({
      where: { clientId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    })

    // Auto-renew expired periods on read
    for (const sub of subs) {
      await renewPeriodIfNeeded(sub)
    }

    // Re-fetch after potential updates
    const updated = await prisma.clientSubscription.findMany({
      where: { clientId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    })

    return {
      success: true as const,
      data: updated.map((s) => ({
        ...s,
        plan: s.plan ? { ...s.plan, price: Number(s.plan.price) } : undefined,
      })),
    }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function assignPlan(data: z.infer<typeof assignPlanSchema>) {
  try {
    const parsed = assignPlanSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }

    const { clientId, planId } = parsed.data

    // Verify client belongs to org
    const client = await prisma.client.findFirst({
      where: { id: clientId, organizationId: ORG_ID },
    })
    if (!client) return { success: false as const, error: "Client not found" }

    // Verify plan exists and is active
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { id: planId, organizationId: ORG_ID },
    })
    if (!plan) return { success: false as const, error: "Plan not found" }
    if (!plan.isActive) return { success: false as const, error: "Plan is not active" }

    const now = new Date()
    const periodDays = getBillingPeriodDays(plan.billingPeriod)
    const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000)

    const subscription = await prisma.clientSubscription.create({
      data: {
        clientId,
        planId,
        status: "active",
        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        appointmentsUsed: 0,
      },
      include: { plan: true },
    })

    // Generate payment on creation (pro-rata or full)
    const planPrice = Number(plan.price)
    const firstPeriodDays = getActiveDays(now, periodEnd)
    const totalPeriodDays = periodDays
    const initialAmount =
      firstPeriodDays < totalPeriodDays
        ? calculateProRata(planPrice, totalPeriodDays, firstPeriodDays)
        : planPrice

    const description =
      initialAmount < planPrice
        ? `Pro-rata charge - ${plan.name} (${firstPeriodDays}/${totalPeriodDays} days)`
        : `Plan subscription - ${plan.name}`

    await generateSubscriptionPayment(
      subscription.id,
      planId,
      initialAmount,
      description,
      "completed",
      now,
    )

    // Send activation email
    if (client.email) {
      void sendEmail({
        templateName: "subscription-activated",
        to: client.email,
        variables: {
          clientName: `${client.firstName} ${client.lastName}`,
          planName: plan.name,
          price: planPrice.toFixed(2),
          billingPeriod: plan.billingPeriod.replace("ly", ""),
          startDate: now.toLocaleDateString(),
          orgName: "Apex Business Solutions",
        },
      })
    }

    return {
      success: true as const,
      data: {
        ...subscription,
        plan: subscription.plan
          ? { ...subscription.plan, price: Number(subscription.plan.price) }
          : undefined,
      },
    }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function cancelSubscription(id: string) {
  try {
    const sub = await prisma.clientSubscription.findFirst({
      where: { id },
      include: { plan: true },
    })
    if (!sub) return { success: false as const, error: "Subscription not found" }
    if (sub.status === "cancelled") {
      return {
        success: true as const,
        data: {
          ...sub,
          plan: sub.plan ? { ...sub.plan, price: Number(sub.plan.price) } : undefined,
        },
      }
    }

    const now = new Date()

    // Calculate refund if cancelled mid-cycle
    if (sub.plan && sub.currentPeriodEnd > now) {
      const planPrice = Number(sub.plan.price)
      const totalPeriodDays = getActiveDays(sub.currentPeriodStart, sub.currentPeriodEnd)
      const usedDays = getActiveDays(sub.currentPeriodStart, now)
      const unusedDays = Math.max(0, totalPeriodDays - usedDays)

      if (unusedDays > 0) {
        const refundAmount = calculateProRata(planPrice, totalPeriodDays, unusedDays)
        if (refundAmount > 0) {
          await generateSubscriptionPayment(
            sub.id,
            sub.planId,
            -refundAmount, // negative = refund
            `Refund - ${sub.plan.name} (${unusedDays}/${totalPeriodDays} days unused)`,
            "refunded",
            now,
          )
        }
      }
    }

    const updated = await prisma.clientSubscription.update({
      where: { id },
      data: { status: "cancelled", endDate: now },
      include: {
        plan: true,
        client: { select: { firstName: true, lastName: true, email: true } },
      },
    })

    // Send cancellation email
    if (updated.client?.email) {
      void sendEmail({
        templateName: "subscription-cancelled",
        to: updated.client.email,
        variables: {
          clientName: `${updated.client.firstName} ${updated.client.lastName}`,
          planName: updated.plan?.name ?? "Subscription",
          endDate: now.toLocaleDateString(),
          orgName: "Apex Business Solutions",
        },
      })
    }

    return {
      success: true as const,
      data: {
        ...updated,
        plan: updated.plan
          ? { ...updated.plan, price: Number(updated.plan.price) }
          : undefined,
      },
    }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

/**
 * Check if a service is covered by any of the client's active subscriptions,
 * and whether the plan has remaining appointments.
 * Returns the list of eligible subscriptions for a given service.
 */
export async function getEligibleSubscriptions(clientId: string, serviceId: string) {
  try {
    const subs = await prisma.clientSubscription.findMany({
      where: {
        clientId,
        status: "active",
        plan: {
          isActive: true,
          planServices: { some: { serviceId } },
        },
      },
      include: {
        plan: {
          include: {
            planServices: {
              where: { serviceId },
            },
          },
        },
      },
    })

    // Auto-renew expired periods
    const eligible = []
    for (const sub of subs) {
      await renewPeriodIfNeeded(sub)
      if (sub.status !== "active") continue

      const planService = sub.plan.planServices[0]
      const globalLimit = sub.plan.maxApptsPerPeriod
      const perServiceLimit = planService?.maxPerPeriod
      const remaining = Math.min(
        globalLimit != null ? globalLimit - sub.appointmentsUsed : Infinity,
        perServiceLimit != null ? perServiceLimit - sub.appointmentsUsed : Infinity,
      )

      if (remaining > 0) {
        eligible.push({
          subscriptionId: sub.id,
          planName: sub.plan.name,
          planId: sub.planId,
          remaining,
          appointmentsUsed: sub.appointmentsUsed,
          maxPerPeriod: Math.min(
            globalLimit ?? Infinity,
            perServiceLimit ?? Infinity,
          ),
        })
      }
    }

    return { success: true as const, data: eligible }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
