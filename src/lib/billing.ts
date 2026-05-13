import { differenceInCalendarDays } from "date-fns"
import type { BillingPeriod } from "@/types"

/**
 * Map a billing period to its duration in days.
 */
export function getBillingPeriodDays(billingPeriod: BillingPeriod): number {
  switch (billingPeriod) {
    case "monthly":
      return 30
    case "quarterly":
      return 90
    case "semiannual":
      return 180
    case "annual":
      return 365
  }
}

/**
 * Calculate a pro-rated amount for a partial billing period.
 *
 * @param planPrice - Full price of the plan
 * @param periodDays - Total days in the full billing period
 * @param activeDays - Number of days the subscription is/was active in this period
 * @returns Pro-rated amount rounded to 2 decimal places
 *
 * @example
 * // Plan R$ 200/mo, active for 17 days of a 31-day month
 * calculateProRata(200, 31, 17) // → 109.68
 */
export function calculateProRata(
  planPrice: number,
  periodDays: number,
  activeDays: number,
): number {
  if (periodDays <= 0) return 0
  const raw = (planPrice * activeDays) / periodDays
  return Math.round(raw * 100) / 100
}

/**
 * Calculate active days for a period, inclusive of both start and end dates.
 * Uses calendar days for consistency.
 */
export function getActiveDays(start: Date, end: Date): number {
  return differenceInCalendarDays(end, start) + 1
}
