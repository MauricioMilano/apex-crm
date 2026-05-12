import { NextResponse } from "next/server"
import { processScheduledEmails, cleanupExpiredSchedules, checkExpiringSubscriptions } from "@/lib/email/scheduler"

/**
 * GET /api/cron/email
 *
 * Cron endpoint that processes pending scheduled emails and cleans up old records.
 * Designed to be called by an external cron service (cron-job.org, Vercel Cron, etc.).
 *
 * Returns a JSON summary of what was processed.
 */
export async function GET() {
  // Verify cron secret if configured
  // In production, add CRON_SECRET env var and validate:
  // const auth = request.headers.get("authorization")
  // if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // }

  const [scheduleResult, cleanupResult, subscriptionResult] = await Promise.all([
    processScheduledEmails(),
    cleanupExpiredSchedules(),
    checkExpiringSubscriptions(),
  ])

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    scheduled: {
      processed: scheduleResult.processed,
      succeeded: scheduleResult.succeeded,
      failed: scheduleResult.failed,
    },
    subscriptions: {
      processed: subscriptionResult.processed,
      succeeded: subscriptionResult.succeeded,
      failed: subscriptionResult.failed,
    },
    cleanup: {
      deleted: cleanupResult.deleted,
    },
  })
}
