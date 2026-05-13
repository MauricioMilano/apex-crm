import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email/send"
import type { SendEmailResult } from "@/lib/email/send"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

export interface ScheduleEmailOptions {
  templateName: string
  to: string | string[]
  variables: Record<string, string>
  scheduledFor: Date
  referenceType?: string
  referenceId?: string
}

export interface ProcessResult {
  processed: number
  succeeded: number
  failed: number
}

/**
 * Schedules an email for future delivery by creating an EmailSchedule record.
 */
export async function scheduleEmail(options: ScheduleEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const record = await prisma.emailSchedule.create({
      data: {
        organizationId: ORG_ID,
        templateName: options.templateName,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        variables: options.variables as Prisma.InputJsonValue,
        scheduledFor: options.scheduledFor,
        referenceType: options.referenceType ?? null,
        referenceId: options.referenceId ?? null,
      },
    })
    return { success: true, id: record.id }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Processes all pending scheduled emails whose scheduledFor time has passed.
 * Sends each email via sendEmail() and marks as sent.
 */
export async function processScheduledEmails(): Promise<ProcessResult> {
  const result: ProcessResult = { processed: 0, succeeded: 0, failed: 0 }

  try {
    const pending = await prisma.emailSchedule.findMany({
      where: {
        sentAt: null,
        scheduledFor: { lte: new Date() },
      },
      orderBy: { scheduledFor: "asc" },
    })

    for (const record of pending) {
      result.processed++

      const sendResult: SendEmailResult = await sendEmail({
        templateName: record.templateName,
        to: record.to,
        variables: record.variables as Record<string, string>,
      })

      if (sendResult.success) {
        await prisma.emailSchedule.update({
          where: { id: record.id },
          data: { sentAt: new Date() },
        })
        result.succeeded++
      } else {
        result.failed++
      }
    }
  } catch (err) {
    // Log but don't throw — cron should not crash
    console.error("[email-scheduler] processScheduledEmails error:", err)
  }

  return result
}

/**
 * Cancels pending scheduled emails by reference (e.g., when an appointment is cancelled).
 * Deletes all unsent schedules matching the given reference type and ID.
 */
export async function cancelScheduledEmails(referenceType: string, referenceId: string): Promise<{ success: boolean; count: number }> {
  try {
    const result = await prisma.emailSchedule.deleteMany({
      where: {
        sentAt: null,
        referenceType,
        referenceId,
      },
    })
    return { success: true, count: result.count }
  } catch {
    return { success: false, count: 0 }
  }
}

/**
 * Cleans up old EmailSchedule records:
 * - Deletes sent records older than 30 days
 * - Deletes unsent records whose scheduledFor is more than 7 days in the past
 */
export async function cleanupExpiredSchedules(): Promise<{ deleted: number }> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  try {
    const result = await prisma.emailSchedule.deleteMany({
      where: {
        OR: [
          { sentAt: { not: null, lte: thirtyDaysAgo } },
          { sentAt: null, scheduledFor: { lte: sevenDaysAgo } },
        ],
      },
    })
    return { deleted: result.count }
  } catch {
    return { deleted: 0 }
  }
}

/**
 * Checks for subscriptions nearing expiry or newly expired.
 * Schedules expiring-soon emails and sends expired notifications.
 */
export async function checkExpiringSubscriptions(): Promise<ProcessResult> {
  const result: ProcessResult = { processed: 0, succeeded: 0, failed: 0 }

  try {
    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Find active subscriptions ending within 7 days
    const expiringSoon = await prisma.clientSubscription.findMany({
      where: {
        status: "active",
        currentPeriodEnd: { gte: now, lte: in7Days },
      },
      include: {
        client: { select: { firstName: true, lastName: true, email: true } },
        plan: { select: { name: true } },
      },
    })

    for (const sub of expiringSoon) {
      if (!sub.client.email) continue

      // Check if already scheduled
      const existing = await prisma.emailSchedule.findFirst({
        where: {
          templateName: "subscription-expiring-soon",
          referenceType: "subscription",
          referenceId: sub.id,
          sentAt: null,
        },
      })
      if (existing) continue

      await scheduleEmail({
        templateName: "subscription-expiring-soon",
        to: sub.client.email,
        variables: {
          clientName: `${sub.client.firstName} ${sub.client.lastName}`,
          planName: sub.plan.name,
          expiryDate: sub.currentPeriodEnd.toLocaleDateString(),
          orgName: "Apex Business Solutions",
        },
        scheduledFor: now,
        referenceType: "subscription",
        referenceId: sub.id,
      })
      result.processed++
    }

    // Find subscriptions that just expired
    const expired = await prisma.clientSubscription.findMany({
      where: {
        status: "active",
        currentPeriodEnd: { lte: now },
      },
      include: {
        client: { select: { firstName: true, lastName: true, email: true } },
        plan: { select: { name: true } },
      },
    })

    for (const sub of expired) {
      if (!sub.client.email) continue

      // Mark as expired in DB
      await prisma.clientSubscription.update({
        where: { id: sub.id },
        data: { status: "expired" },
      })

      const sendResult = await sendEmail({
        templateName: "subscription-expired",
        to: sub.client.email,
        variables: {
          clientName: `${sub.client.firstName} ${sub.client.lastName}`,
          planName: sub.plan.name,
          orgName: "Apex Business Solutions",
        },
      })

      result.processed++
      if (sendResult.success) result.succeeded++
      else result.failed++
    }
  } catch (err) {
    console.error("[email-scheduler] checkExpiringSubscriptions error:", err)
  }

  return result
}
